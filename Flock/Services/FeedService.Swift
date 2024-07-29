// this will handle user and friend feeds

// created 07/27/24

import Foundation
import SwiftUI
import FirebaseFirestore
import FirebaseFunctions
import PostHelper
import PostOperationsService
import PostDataService

enum PrayerRequestRetrievalError: Error {
    case noUserID
    case noPrayerRequestID
    case noPrayerRequest
    case errorRetrievingFromFirebase
}

class FeedService {
    private let db = Firestore.firestore()

    func updateFriendsFeed(post: Post, person: Person, friend: Person, updateFriend: Bool) async throws {
        do {
            if updateFriend {
                let ref = db.collection("prayerFeed").document(friend.userID).collection("prayerRequests").document(post.id)
                
                try await ref.setData([
                    "datePosted": post.date,
                    "firstName": post.firstName,
                    "lastName": post.lastName,
                    "status": post.status,
                    "prayerRequestText": post.postText,
                    "postType": post.postType,
                    "userID": person.userID,
                    "username": person.username,
                    "privacy": post.privacy,
                    "prayerRequestTitle": post.postTitle,
                    "latestUpdateText": post.latestUpdateText,
                    "latestUpdateDatePosted": post.latestUpdateDatePosted,
                    "latestUpdateType": post.latestUpdateType
                ])
                
                print("success: \(post.id)")
                print("from person: \(person.userID)")
                print("posting to: \(friend.userID)")
                print("path: \(ref.path)")
            } else {
                let ref = db.collection("prayerFeed").document(person.userID).collection("prayerRequests").document(post.id)
                 try await ref.setData([
                    "datePosted": post.date,
                    "firstName": post.firstName,
                    "lastName": post.lastName,
                    "status": post.status,
                    "prayerRequestText": post.postText,
                    "postType": post.postType,
                    "userID": person.userID,
                    "username": person.username,
                    "privacy": post.privacy,
                    "prayerRequestTitle": post.postTitle,
                    "latestUpdateText": post.latestUpdateText,
                    "latestUpdateDatePosted": post.latestUpdateDatePosted,
                    "latestUpdateType": post.latestUpdateType,
                    "isPinned": post.isPinned
                ])
            }
        } catch {
            print(error)
        }
    }

    func deleteFromFeed(post: Post, person: Person, friendsList: [Person]) {
        // Delete PrayerRequestID from prayerFeed/{userID}
        if post.privacy == "public" && friendsList.isEmpty == false {
            for friend in friendsList {
                let ref2 = db.collection("prayerFeed").document(friend.userID).collection("prayerRequests").document(post.id)
                ref2.delete() { err in
                    if let err = err {
                        print("Error removing document: \(err)")
                    } else {
                        print("Document successfully deleted")
                        print(post.id)
                        print(post.postText)
                    }
                }
            }
        } // Delete from your friends' feeds.
        
        // Delete from your own user feed.
        let ref2 = db.collection("prayerFeed").document(person.userID).collection("prayerRequests").document(post.id)
        ref2.delete() { err in
            if let err = err {
                print("Error removing document: \(err)")
            } else {
                print("Document successfully deleted")
                print(post.id)
                print(post.postText)
            }
        }
    }

    func publicToPrivate(post: Post, friendsList: [Person]) {
        if friendsList.isEmpty == false {
            for friend in friendsList {
                let ref2 = db.collection("prayerFeed").document(friend.userID).collection("prayerRequests").document(post.id)
                ref2.delete() { err in
                    if let err = err {
                        print("Error removing document: \(err)")
                    } else {
                        print("Document successfully deleted")
                        print(post.id)
                        print(post.postText)
                    }
                }
            }
        }
    } // This function allows you to pass in a prayer request and delete that from friends' feeds if you have changed it from public to private.
}