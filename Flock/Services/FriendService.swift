//
//  FriendService.swift
//  Flock
//
//  Created by Preston Mar on 7/21/24.
//

import Foundation
import FirebaseAuth
import FirebaseFirestore

class FriendService {
    let db = Firestore.firestore() // initiaties Firestore
    
    //Adding a friend - this updates the historical prayer feed
    func updateFriendHistoricalPostsIntoFeed(user: Person, friend: Person) async throws {
        //In this scenario, userID is the userID of the person retrieving data from the 'person'.
        do {
            //user is retrieving prayer requests of the friend: person.userID and person: person.
            let posts = try await PostOperationsService().getPosts(userID: friend.userID, person: friend)
            
            print("posts: \(posts.map( {$0.id}).joined(separator: ", "))")
            print("user: \(user.userID)")
            //for each prayer request, user is taking the friend's prayer request and updating them to their own feed. The user becomes the 'friend' of the person.
            for post in posts {
                do {
                    try await FeedService().updateFriendsFeed(post: post, person: friend, friend: user, updateFriend: true)
                } catch {
                    print(error.localizedDescription)
                }
            }
        } catch {
            throw PrayerPersonRetrievalError.errorRetrievingFromFirebase
        }
    }
    
    // Account settings
    func deletePerson(user: Person, friendsList: [Person]) async throws {
        Task {
            do {
                // delete from prayer requests list.
                let prayerRequests = try await db.collection("prayerRequests").whereField("userID", isEqualTo: user.userID).getDocuments()
                for request in prayerRequests.documents {
                    try await request.reference.delete()
                }
                
                // delete user's feed
                let prayerFeedRef = try await db.collection("prayerFeed").document(user.userID).collection("prayerRequests").getDocuments()
                for request in prayerFeedRef.documents {
                    try await request.reference.delete()
                }
                
                // delete from friend's feed
                if friendsList.isEmpty == false {
                    for friend in friendsList {
                        let prayerRequests = try await db.collection("prayerFeed").document(friend.userID).collection("prayerRequests").whereField("userID", isEqualTo: user.userID).getDocuments()
                        
                        for request in prayerRequests.documents {
                            try await request.reference.delete()
                        }
                    }
                }
                
                // delete user's info data.
                let userFriendsListRef = try await db.collection("users").document(user.userID).collection("friendsList").getDocuments()
                for request in userFriendsListRef.documents {
                    try await request.reference.delete()
                }
                
                let userPrayerListRef = try await db.collection("users").document(user.userID).collection("prayerList").getDocuments()
                for person in userPrayerListRef.documents {
                    let prayerRequests = try await person.reference.collection("prayerRequests").getDocuments()
                    for request in prayerRequests.documents {
                        try await request.reference.delete()
                    }
                    try await person.reference.delete()
                }
                
                let usersRef = db.collection("users").document(user.userID)
                try await usersRef.delete()
                
                let usernameRef = db.collection("usernames").document(user.username)
                try await usernameRef.delete()
                
                // remove firebase account
                try await Auth.auth().currentUser?.delete()
                
            } catch {
                throw error
            }
        }
    }
        
    // Login functions:
    func getFriendsList(userID: String) async throws -> ([Person], [Person]) {
        var friendsList: [Person] = []
        var pendingFriendsList: [Person] = []
        
        guard userID != "" else {
            throw PrayerPersonRetrievalError.noUserID
        }
        
        let friendsListRef = db.collection("users").document(userID).collection("friendsList")/*.whereField("state", isNotEqualTo: "pending")*/
        
        let querySnapshot = try await friendsListRef.getDocuments()
        
        //append FriendsListArray in userHolder
        for document in querySnapshot.documents {
            if document.exists {
                let userID = document.get("userID") as? String ?? ""
                let username = document.get("username") as? String ?? ""
                let email = document.get("email") as? String ?? ""
                let firstName = document.get("firstName") as? String ?? ""
                let lastName = document.get("lastName") as? String ?? ""
                let state = document.get("state") as? String ?? ""
//                let prayerCalendarInd = document.get("prayerCalendarInd") as? Bool ?? false
                
                let person = Person(userID: userID, username: username, email: email, firstName: firstName, lastName: lastName, friendState: state/*, prayerCalendarInd: prayerCalendarInd*/)
                
                if state == "pending" {
                    pendingFriendsList.append(person)
                } else {
                    friendsList.append(person)
                }
            }
        }
        
        return (friendsList, pendingFriendsList)
    }
    
    func addFriend(user: Person, friend: Person) async throws {
        // Update the friends list of the person who you have now added to your list. Their friends list is updated, so that when they post, it will add to your feed. At the same time, any of their existing requests will also populate into your feed.
        let refFriends = db.collection("users").document(friend.userID).collection("friendsList").document(user.userID)
        let document = try await refFriends.getDocument()
        
//            guard !document.exists else {
//                placeholder for after friends get transferred
//            }
        
        if document.exists { // only applies for initial beta launch of friends page, where some friends have documents but without a state.
            if document.get("state") == nil {
                try await refFriends.updateData([
                    "state": "pending"
                ])
            } else {
                throw AddFriendError.friendAddedAlready
            }
        } else { // if document doesn't exist, set data.
            try await refFriends.setData([
                "username": user.username,
                "userID": user.userID,
                "firstName": user.firstName,
                "lastName": user.lastName,
                "email": user.email,
                "state": "pending"
            ])
        }
        
        // Update user's personal friends list with state of 'sent'
        let refUserFriends = db.collection("users").document(user.userID).collection("friendsList").document(friend.userID)
        let userFriendsDocument = try await refUserFriends.getDocument()
        
//            guard !document.exists else {
//                placeholder for after friends get transferred
//            }
        
        if userFriendsDocument.exists { // only applies for initial beta launch of friends page, where some friends have documents but without a state.
            if userFriendsDocument.get("state") == nil {
                try await refUserFriends.updateData([
                    "state": "sent"
                ])
            } else {
                throw AddFriendError.friendAddedAlready
            }
        } else { // if document doesn't exist, set data.
            try await refUserFriends.setData([
                "username": friend.username,
                "userID": friend.userID,
                "firstName": friend.firstName,
                "lastName": friend.lastName,
                "email": friend.email,
                "state": "sent"
            ])
        }
    }
    
    func approveFriend(user: Person, friend: Person) async throws {
        do {
            // Updates your friends list with the person who you has now added you. Your friends list is updated, so that when you post, it will add to your feed. All of your existing posts will also populate into their feed.
            let refFriends = db.collection("users").document(user.userID).collection("friendsList").document(friend.userID)
            let document = try await refFriends.getDocument()
            
            guard document.exists else {
                fatalError("Could not find existing friend request to approve")
            }
                
            if document.exists {
                try await refFriends.updateData([
                    "state": "approved"
                ])
            }
            
            try await updateFriendHistoricalPostsIntoFeed(user: user, friend: friend) // load historical posts into your feed once you approve.
            
            // Update your friends' friends list with the your information so you will now see their posts. All of their existing posts will also populate to your feed.
            let theirFriends = db.collection("users").document(friend.userID).collection("friendsList").document(user.userID)
            
            try await theirFriends.updateData([
                "state": "approved"
            ])
            
            try await updateFriendHistoricalPostsIntoFeed(user: friend, friend: user) // load historical posts into that friend's feed once you approve.
            
        } catch {
            print(error)
        }
    }
    
    func removeFriendPostsFromUserFeed(userID: String, friendUsernameToRemove: String) async {
        // Fetch all prayer requests with that person's first name and last name, so they are removed from your feed.
        do{
            let refDelete = try await db.collection("prayerFeed").document(userID).collection("prayerRequests")
                .whereField("firstName", isEqualTo: String(friendUsernameToRemove.split(separator: "/").first ?? ""))
                .whereField("lastName", isEqualTo: String(friendUsernameToRemove.split(separator: "/").last ?? ""))
                .getDocuments()
            
            for document in refDelete.documents {
                try await document.reference.delete()
            }
        } catch{
            print("Error removing posts: \(error.localizedDescription)")
        }

    }
    
    func deleteFriend(user: Person, friend: Person) async throws {
        do {
            // Update the friends list of the person who you have now removed from your list. Their friends list is updated, so that when they post, it will not add to your feed.
            let refFriends = db.collection("users").document(friend.userID).collection("friendsList").document(user.userID)
            try await refFriends.delete()
            
            // Update your prayer feed to remove that person's prayer requests from your current feed.
            let refDelete = try await db.collection("prayerFeed").document(user.userID).collection("prayerRequests").whereField("userID", isEqualTo: friend.userID).getDocuments()
            for document in refDelete.documents {
                try await document.reference.delete()
            }
            
            // Update user's personal friends list and delete historical posts.
            let refUser = db.collection("users").document(user.userID).collection("friendsList").document(friend.userID)
            try await refUser.delete()
            
            // Update your prayer feed to remove that person's prayer requests from your current feed.
            let refDeleteUser = try await db.collection("prayerFeed").document(friend.userID).collection("prayerRequests").whereField("userID", isEqualTo: user.userID).getDocuments()
            for document in refDeleteUser.documents {
                try await document.reference.delete()
            }
        } catch {
            print(error)
        }
    }
    
    func dismissFriendRequest(user: Person, friend: Person) async throws {
        do {
            // Update the friends list of the person who you have now removed from your list. Their friends list is updated, so that when they post, it will not add to your feed.
            let refFriends = db.collection("users").document(friend.userID).collection("friendsList").document(user.userID)
            try await refFriends.delete()
            
            // Update user's personal friends list and delete historical posts.
            let refUser = db.collection("users").document(user.userID).collection("friendsList").document(friend.userID)
            try await refUser.delete()
        } catch {
            print(error)
        }
    }
    
    func acceptOrDenyFriendRequest(acceptOrDeny: Bool, user: Person, friend: Person) async throws {
        if acceptOrDeny {
            try await approveFriend(user: user, friend: friend)
        } else {
            try await dismissFriendRequest(user: user, friend: friend) // temp swapped friend and user to not screw up existing feed.
        }
    }
    
    func addFriendtoCalendarIndicator(user: Person, friend: Person) async throws {
        // Update the friend document in firebase with a calendar indicator as true.
        do {
            let refFriends = db.collection("users").document(user.userID).collection("friendsList").document(friend.userID)
            let document = try await refFriends.getDocument()
            
            guard document.exists else {
                fatalError("Could not find existing friend")
            }
                
            if document.exists {
                try await refFriends.updateData([
                    "prayerCalendarInd": true
                ])
            }
        } catch {
            print(error)
        }
    }
    
    func validateFriendUsername(username: String/*, firstName: String, lastName: String*/) async throws -> (Bool, Person) {
        // This function allows you to pass in a username and return a boolean whether the username is tied to an account, and if it's tied to the correct first and last name. For adding friends.
        var check: Bool = false
        var person: Person = Person()
        
        do {
            let ref = db.collection("users").whereField("username", isEqualTo: username)
            let querySnapshot = try await ref.getDocuments()
            
            //append FriendsListArray in userHolder
            for document in querySnapshot.documents {
                if document.exists {
//                    if document.get("username") as! String == username.lowercased() && document.get("firstName") as! String == firstName.capitalized && document.get("lastName") as! String == lastName.capitalized {
                        check = true
                        
                        let firstName = document.get("firstName") as? String ?? ""
                        let lastName = document.get("lastName") as? String ?? ""
                        let username = document.get("username") as? String ?? ""
                        let userID = document.get("userID") as? String ?? ""
                        let email = document.get("email") as? String ?? ""
                        
                        person = Person(userID: userID, username: username, email: email, firstName: firstName, lastName: lastName)
//                    }
                }
            }
        } catch {
            print(error)
        }
        return (check, person)
    }
}
