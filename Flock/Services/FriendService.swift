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
    
    // MARK: - Add Friend Functions
    
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
            NetworkingLogger.error("FriendService.approveFriend failed \(error)")
        }
    }
    
    func removeFriendPostsFromUserFeed(userID: String, friendUsernameToRemove: String) async {
        // Fetch all prayer requests with that person's first name and last name, so they are removed from your feed.
        do {
            let refDelete = try await db.collection("prayerFeed").document(userID).collection("prayerRequests")
                .whereField("firstName", isEqualTo: String(friendUsernameToRemove.split(separator: "/").first ?? ""))
                .whereField("lastName", isEqualTo: String(friendUsernameToRemove.split(separator: "/").last ?? ""))
                .getDocuments()
            
            for document in refDelete.documents {
                try await document.reference.delete()
            }
        } catch{
            NetworkingLogger.error("FriendService.removeFriendPostsFromUserFeed Error \(error.localizedDescription)")
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
            NetworkingLogger.error("FriendService.dismissFriendRequest failed \(error)")
        }
    }
    
    func acceptOrDenyFriendRequest(acceptOrDeny: Bool, user: Person, friend: Person) async throws {
        if acceptOrDeny {
            try await approveFriend(user: user, friend: friend)
        } else {
            try await dismissFriendRequest(user: user, friend: friend) // temp swapped friend and user to not screw up existing feed.
        }
    }
    
    //Function to update the historical prayer feed
    func updateFriendHistoricalPostsIntoFeed(user: Person, friend: Person) async throws {
        //In this scenario, userID is the userID of the person retrieving data from the 'person'.
        do {
            //user is retrieving prayer requests of the friend: person.userID and person: person.
            let posts = try await PostOperationsService().getPosts(userID: friend.userID, person: friend)

            //for each prayer request, user is taking the friend's prayer request and updating them to their own feed. The user becomes the 'friend' of the person.
            for post in posts {
                do {
                    try await FeedService().updateFriendsFeed(post: post, person: friend, friend: user, updateFriend: true)
                } catch {
                    NetworkingLogger.error("FriendService.updateFriendHistoricalPostsIntoFeed \(error.localizedDescription)")
                }
            }
        } catch {
            throw PersonRetrievalError.errorRetrievingFromFirebase
        }
    }
    
    func addPrivateFriend(firstName: String, lastName: String, user: Person) async throws {
        guard firstName != "" && lastName != "" else {
            throw AddFriendError.missingName
        }

        guard (firstName.lowercased()+lastName.lowercased()) != (user.firstName.lowercased() + user.lastName.lowercased()) else {
            throw AddFriendError.invalidName
        }
            
        let ref = db.collection("users").document(user.userID).collection("friendsList").document()
        
        try await ref.setData([
            "username": user.username,
            "userID": user.userID,
            "firstName": firstName,
            "lastName": lastName,
            "email": "",
            "state": "private"
        ])
    }
    
    // MARK: - Helper Functions for Deleting a Person and Documents
    
    // Account settings
    // Helper to delete documents in a collection based on user ID
    func deleteDocuments(from collection: String, where field: String, isEqualTo value: Any) async throws {
        let documents = try await db.collection(collection).whereField(field, isEqualTo: value).getDocuments()
        for document in documents.documents {
            try await document.reference.delete()
        }
    }

    // Helper to delete a user's subcollections
    func deleteSubcollection(from collection: String, documentID: String, subcollection: String) async throws {
        let subcollectionRef = try await db.collection(collection).document(documentID).collection(subcollection).getDocuments()
        for document in subcollectionRef.documents {
            try await document.reference.delete()
        }
    }

    // Helper to delete a user from friend's feed
    func deleteFriend(user: Person, friend: Person) async throws {
        do {
            if friend.isPublic {
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
            } else { // if user is private, delete the friend from just your prayer list.
                
                // Update user's personal friends list and delete historical posts.
                let refUser = try await db.collection("users").document(user.userID).collection("friendsList")
                    .whereField("firstName", isEqualTo: friend.firstName.lowercased())
                    .whereField("lastName", isEqualTo: friend.lastName.lowercased()).getDocuments()
                
                for document in refUser.documents {
                    try await document.reference.delete()
                }
        
            }
        } catch {
            NetworkingLogger.error("FriendService.deleteFriend failed \(error)")
        }
    }

    // Main function to delete user data
    func deletePerson(user: Person, friendsList: [Person]) async throws {
        Task {
            do {
                // Delete user's prayer requests and feed
                try await deleteDocuments(from: "prayerRequests", where: "userID", isEqualTo: user.userID)
                try await deleteSubcollection(from: "prayerFeed", documentID: user.userID, subcollection: "prayerRequests")
                
                // Delete all notifications
                try await NotificationHelper().deleteAllNotifications(userID: user.userID)
                
                // Delete from each friend's feed
                for friend in friendsList {
                    try await deleteFriend(user: user, friend: friend)
                }

                // Delete user's friends list and prayer list
                try await deleteSubcollection(from: "users", documentID: user.userID, subcollection: "friendsList")
                try await deleteSubcollection(from: "users", documentID: user.userID, subcollection: "prayerList")
                
                // Delete user's profile and username
                let usersRef = db.collection("users").document(user.userID)
                if try await usersRef.getDocument().exists {
                    try await usersRef.delete()
                }
                
                let usernameRef = db.collection("usernames").document(user.username)
                if try await usernameRef.getDocument().exists {
                    try await usernameRef.delete()
                }

                // Remove Firebase account
                try await Auth.auth().currentUser?.delete()

            } catch {
                NetworkingLogger.error("FriendService.deleteAccount \(error.localizedDescription)")
                throw error
            }
        }
    }
        
    // MARK: - Login Functions
    // Login functions:
    func getFriendsList(userID: String) async throws -> ([Person], [Person]) {
        var friendsList: [Person] = []
        var pendingFriendsList: [Person] = []
        
        guard userID != "" else {
            throw PersonRetrievalError.noUserID
        }
        
        let friendsListRef = db.collection("users").document(userID).collection("friendsList")
        
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
                } else if state == "approved" {
                    friendsList.append(person)
                }
            }
        }
        
        return (friendsList, pendingFriendsList)
    }
    
    // MARK: - Other Friend Helper Functions
    
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
            NetworkingLogger.error("FriendService.addFriendToCalendarIndicator failed \(error)")
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
            NetworkingLogger.error("FriendService.validateFriendUsername failed \(error)")
        }
        return (check, person)
    }
}
