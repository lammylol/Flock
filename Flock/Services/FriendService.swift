//
//  FriendService.swift
//  Flock
//
//  Created by Preston Mar on 7/21/24.
//

import Foundation
import FirebaseFirestore
import FirebaseAuth

class FriendService {
    let db = Firestore.firestore() // initiaties Firestore
    
    //Adding a friend - this updates the historical prayer feed
    func updateFriendHistoricalPostsIntoFeed(user: Person, person: Person) async throws {
        //In this scenario, userID is the userID of the person retrieving data from the 'person'.
        do {
            //user is retrieving prayer requests of the friend: person.userID and person: person.
            let posts = try await PostHelper().getPosts(userID: person.userID, person: person, status: "Current", fetchOnlyPublic: true)
            
            print("posts: \(posts.map( {$0.id}).joined(separator: ", "))")
            print("user: \(user.userID)")
            //for each prayer request, user is taking the friend's prayer request and updating them to their own feed. The user becomes the 'friend' of the person.
            for post in posts {
                do {
                    try await PostHelper().updateFriendsFeed(post: post, person: person, friend: user, updateFriend: true)
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
        }}
    
    // Login functions:
    func getFriendsList(userID: String) async throws -> [Person]{
        let db = Firestore.firestore() // initiaties Firestore
        var friendsList: [Person] = []
        
        guard userID != "" else {
            throw PrayerPersonRetrievalError.noUserID
        }
        
        do {
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
                    //                print("\(document.documentID) => \(document.data())")
                    
                    let person = Person(userID: userID, username: username, email: email, firstName: firstName, lastName: lastName)
                    friendsList.append(person)
                }
            }
        } catch {
          print("Error getting documents: \(error)")
        } // get friends list and add that to userholder.friendslist
        
        return friendsList
    }
    
    func addFriend(user: Person, friend: Person) async throws {
        // Update the friends list of the person who you have now added to your list. Their friends list is updated, so that when they post, it will add to your feed. At the same time, any of their existing requests will also populate into your feed.
        do {
            let refFriends = db.collection("users").document(friend.userID).collection("friendsList").document(user.userID)
            let document = try await refFriends.getDocument()
            
            if !document.exists {
                try await refFriends.setData([
                    "username": user.username,
                    "userID": user.userID,
                    "firstName": user.firstName,
                    "lastName": user.lastName,
                    "email": user.email
                ])
            }
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
        }catch{
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
        } catch {
            print(error)
        }
    }
}
