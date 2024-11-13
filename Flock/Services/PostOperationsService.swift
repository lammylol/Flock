// Handles essential post CRUD operations

import Foundation
import FirebaseFirestore
import FirebaseAuth

class PostOperationsService {
    private let db = Firestore.firestore()

    //Retrieve prayer requests from Firestore
    func getPosts(userID: String, person: Person) async throws -> [Post] {
        var prayerRequests = [Post]()
        
        guard userID != "" else {
            throw PrayerRequestRetrievalError.noUserID
        }
        
        var profiles: Query
        
        do {
            profiles = db.collection("prayerRequests")
                .whereField("status", in: ["Current", "Answered"])
                .whereField("userID", isEqualTo: userID)
                .whereField("privacy", isEqualTo: "public")
                .order(by: "latestUpdateDatePosted", descending: true)
            
            let querySnapshot = try await profiles.getDocuments()
            
            for document in querySnapshot.documents {
                let timestamp = document.data()["datePosted"] as? Timestamp ?? Timestamp()
                let datePosted = timestamp.dateValue()
                
                let latestTimestamp = document.data()["latestUpdateDatePosted"] as? Timestamp ?? Timestamp()
                let latestUpdateDatePosted = latestTimestamp.dateValue()
                
                let firstName = document.data()["firstName"] as? String ?? ""
                let lastName = document.data()["lastName"] as? String ?? ""
                let postTitle = document.data()["prayerRequestTitle"] as? String ?? ""
                let postText = document.data()["prayerRequestText"] as? String ?? ""
                let postType =
                Post.PostType(rawValue: document.data()["postType"] as? String ?? "") ?? .note
                let status = 
                Post.Status(rawValue: document.data()["status"] as? String ?? "") ?? .none
                let userID = document.data()["userID"] as? String ?? ""
                let username = document.data()["username"] as? String ?? ""
                let privacy = 
                Post.Privacy(rawValue: document.data()["privacy"] as? String ?? "") ?? .isPrivate
                let isPinned = document.data()["isPinned"] as? Bool ?? false
                let documentID = document.documentID as String
                let latestUpdateText = document.data()["latestUpdateText"] as? String ?? ""
                let latestUpdateType = document.data()["latestUpdateType"] as? String ?? ""
                
                let prayerRequest = Post(id: documentID, 
                                         date: datePosted,
                                         userID: userID,
                                         username: username,
                                         firstName: firstName,
                                         lastName: lastName,
                                         postTitle: postTitle,
                                         postText: postText,
                                         postType: postType,
                                         status: status,
                                         latestUpdateText: latestUpdateText,
                                         latestUpdateDatePosted: latestUpdateDatePosted,
                                         latestUpdateType: latestUpdateType,
                                         privacy: privacy,
                                         isPinned: isPinned)
                
                prayerRequests.append(prayerRequest)
            }
            NetworkingLogger.debug("postOperations.getPosts retrieved \(prayerRequests.count) posts for \(userID, privacy: .private)")
        } catch {
            NetworkingLogger.error("postOperations.getPosts error retrieving \(userID, privacy: .private): \(error)")
        }
        return prayerRequests
    }

    func getPost(prayerRequest: Post, user: Person) async throws -> Post {
        guard prayerRequest.id != "" else {
            throw PrayerRequestRetrievalError.noPrayerRequestID
        }
        
        let ref = db.collection("prayerFeed").document(user.userID).collection("prayerRequests").document(prayerRequest.id)
        
        var prayerRequest = Post.blank
        
        do {
            let document = try await ref.getDocument()
            
            guard document.exists else {
                throw PrayerRequestRetrievalError.noPrayerRequest
            }

            if document.exists {
                let timestamp = document.data()?["datePosted"] as? Timestamp ?? Timestamp()
                let datePosted = timestamp.dateValue()
                
                let latestTimestamp = document.data()?["latestUpdateDatePosted"] as? Timestamp ?? Timestamp()
                let latestUpdateDatePosted = latestTimestamp.dateValue()
                
                let firstName = document.data()?["firstName"] as? String ?? ""
                let lastName = document.data()?["lastName"] as? String ?? ""
                let postTitle = document.data()?["prayerRequestTitle"] as? String ?? ""
                let postText = document.data()?["prayerRequestText"] as? String ?? ""
                let postType =
                Post.PostType(rawValue: document.data()?["postType"] as? String ?? "") ?? .note
                let status =
                Post.Status(rawValue: document.data()?["status"] as? String ?? "") ?? .none
                let userID = document.data()?["userID"] as? String ?? ""
                let username = document.data()?["username"] as? String ?? ""
                let privacy =
                Post.Privacy(rawValue: document.data()?["privacy"] as? String ?? "") ?? .isPrivate
                let documentID = document.documentID as String
                let latestUpdateText = document.data()?["latestUpdateText"] as? String ?? ""
                let latestUpdateType = document.data()?["latestUpdateType"] as? String ?? ""
                let isPinned = document.data()?["isPinned"] as? Bool ?? false
                let lastSeenNotificationCount = document.data()?["lastSeenNotificationCount"] as? Int ?? 0
            
                prayerRequest = Post(id: documentID, 
                                     date: datePosted,
                                     userID: userID,
                                     username: username,
                                     firstName: firstName,
                                     lastName: lastName,
                                     postTitle: postTitle,
                                     postText: postText,
                                     postType: postType,
                                     status: status,
                                     latestUpdateText: latestUpdateText,
                                     latestUpdateDatePosted: latestUpdateDatePosted,
                                     latestUpdateType: latestUpdateType,
                                     privacy: privacy,
                                     isPinned: isPinned)
            }
        } catch {
            NetworkingLogger.error("postOperations.getPost failed getting \(prayerRequest.id) \(error)")
            throw error
        }
        NetworkingLogger.debug("postOperations.getPost got \(prayerRequest.id) \(prayerRequest.privacy.descriptionKey) \(prayerRequest.userID, privacy: .private)")
        return prayerRequest
    }

    // this function enables the creation and submission of a new prayer request. It does three things: 1) add to user collection of prayer requests, 2) add to prayer requests collection, and 3) adds the prayer request to all friends of the person only if the prayer request is the user's main profile.
    func createPost(post: Post, person: Person, friendsList: [Person]) async throws {
        var prayerRequestID = ""
        
        do{
            // Add PrayerRequestID and Data to prayerRequests/{prayerRequestID}
            let prayerRequestsRef =
            db.collection("prayerRequests").document()
            
            try await prayerRequestsRef.setData([
                "datePosted": post.date,
                "firstName": post.firstName,
                "lastName": post.lastName,
                "status": Post.Status.current.descriptionKey.capitalized,
                "prayerRequestText": post.postText,
                "postType": post.postType.descriptionKey,
                "userID": post.userID,
                "username": post.username,
                "privacy": post.privacy.descriptionKey,
                "prayerRequestTitle": post.postTitle.capitalized,
                "latestUpdateText": "",
                "latestUpdateDatePosted": post.date,
                "latestUpdateType": "",
            ])
            prayerRequestID = prayerRequestsRef.documentID
            NetworkingLogger.debug("postOperations.createPost.addToPrayerRequests \(post.userID, privacy: .private) created \(prayerRequestID)")
        } catch{
            NetworkingLogger.error("postOperations.createPost.addToPrayerRequests failed to create for \(post.userID, privacy: .private)")
        }
        
        do {
            // Create new PrayerRequestID to users/{userID}/prayerList/{person}/prayerRequests
            let documentID = post.friendType == .privateFriend ? person.privateFriendIdentifier : person.userID
            let ref = db.collection("users").document(post.userID).collection("userPostsCollection").document("\(documentID)").collection("posts").document(prayerRequestID)

            try await ref.setData([
                "datePosted": post.date,
                "firstName": post.firstName,
                "lastName": post.lastName,
                "status": Post.Status.current.descriptionKey.capitalized,
                "prayerRequestText": post.postText,
                "postType": post.postType.descriptionKey,
                "userID": post.userID,
                "username": post.username,
                "privacy": post.privacy.descriptionKey,
                // friendtype
                "prayerRequestTitle": post.postTitle.capitalized,
                "latestUpdateText": "",
                "latestUpdateDatePosted": post.date,
                "latestUpdateType": "",
                "isPinned": post.isPinned
            ])
            NetworkingLogger.debug("postOperations.createPost.createPrayerRequestID created prayerRequestID \(prayerRequestID) \(post.userID)")
        }catch {
            NetworkingLogger.error("postOperations.createPost.createPrayerRequestID failed to create a PrayerRequestID \(post.userID, privacy: .private)")
        }
        
        do{
            guard(prayerRequestID != "") else {
                throw PrayerRequestRetrievalError.noPrayerRequestID
            }
            // Add PrayerRequestID to prayerFeed/{userID}
            if post.privacy == .isPrivate, !friendsList.isEmpty {
                for friend in friendsList {
                    let ref2 = db.collection("prayerFeed").document(friend.userID).collection("prayerRequests").document(prayerRequestID)
                    try await ref2.setData([
                        "datePosted": post.date,
                        "firstName": post.firstName,
                        "lastName": post.lastName,
                        "status": Post.Status.current.descriptionKey.capitalized,
                        "prayerRequestText": post.postText,
                        "postType": post.postType.descriptionKey,
                        "userID": post.userID,
                        "username": post.username,
                        "privacy": post.privacy.descriptionKey,
                        "prayerRequestTitle": post.postTitle.capitalized,
                        "latestUpdateText": "",
                        "latestUpdateDatePosted": post.date,
                        "latestUpdateType": "",
                        "lastSeenNotificationCount": 1 // this defaults to 1. once user takes action to view or select, notification goes to 0. if update is added, notification goes to +1.
                    ])
                } // If you have friends and have set privacy to public, this will update all friends feeds.
            }
            let ref2 = db.collection("prayerFeed").document(post.userID).collection("prayerRequests").document(prayerRequestID)
            try await ref2.setData([
                "datePosted": post.date,
                "firstName": post.firstName,
                "lastName": post.lastName,
                "status": Post.Status.current.descriptionKey.capitalized,
                "prayerRequestText": post.postText,
                "postType": post.postType.descriptionKey,
                "userID": post.userID,
                "username": post.username,
                "privacy": post.privacy.descriptionKey,
                "prayerRequestTitle": post.postTitle.capitalized,
                "latestUpdateText": "",
                "latestUpdateDatePosted": post.date,
                "latestUpdateType": "",
                "isPinned": post.isPinned
            ]) // if the prayer is for a local user, it will update your own feed.
            NetworkingLogger.debug("postOperations.createPost.addToPrayerFeed added to prayerFeed")
        }catch{
            NetworkingLogger.error("postOperations.createPost.addToPrayerFeed failed")
        }
    }

    // This function enables an edit to a prayer requests off of a selected prayer request.
    func editPost(post: Post, person: Person, friendsList: [Person]) async throws {
        do {
            let ref = db.collection("users").document(person.userID).collection("prayerList").document("\(post.firstName.lowercased())_\(post.lastName.lowercased())").collection("prayerRequests").document(post.id)
            
            try await ref.updateData([
                "datePosted": post.date,
                "status": post.status.descriptionKey.capitalized,
                "postType": post.postType.descriptionKey,
                "prayerRequestText": post.postText,
                "privacy": post.privacy.descriptionKey,
                "prayerRequestTitle": post.postTitle,
                "isPinned": post.isPinned
            ])
            
            // Add PrayerRequestID to prayerFeed/{userID}
            if post.status == .noLongerNeeded {
                try await FeedService().deleteFromFeed(post: post, person: person, friendsList: friendsList) // If it is no longer needed, remove from all feeds. If not, update all feeds.
                NetworkingLogger.debug("postOperations.editPost - \(post.id) removed from all feeds")
            } else {
                if post.privacy == .isPublic, !friendsList.isEmpty {
                    for friend in friendsList {
                        try await FeedService().updateFriendsFeed(post: post, person: person, friend: friend, updateFriend: true)
                    }
                }
                try await FeedService().updateFriendsFeed(post: post, person: person, friend: Person(), updateFriend: false) // Update your own feed.
                
                // Add PrayerRequestID and Data to prayerRequests/{prayerRequestID}
                try await updatePostsDataCollection(prayerRequest: post, person: person)
                NetworkingLogger.debug("postOperations.editPost - \(post.id) edit saved")
            }
        } catch {
            NetworkingLogger.error("postOperations.editPost failed to edit \(post.id) \(error)")
        }
    }

    //person passed in for the feed is the user. prayer passed in for the profile view is the person being viewed.
    func deletePost(post: Post, person: Person, friendsList: [Person]) async throws {
        do{
            let ref = db.collection("users").document(person.userID).collection("prayerList").document("\(post.firstName.lowercased())_\(post.lastName.lowercased())").collection("prayerRequests").document(post.id)
            
            try await ref.delete()
            NetworkingLogger.debug("postOperations.deletePost.deleteFromPrayerList deleted \(post.id)")
        }catch{
            NetworkingLogger.error("postOperations.deletePost.deleteFromPrayerList failed deletingn \(post.id) from ")
        }
        
        // Delete PrayerRequest from all feeds: friend feeds and user's feed.
        try await FeedService().deleteFromFeed(post: post, person: person, friendsList: friendsList)
        
        do {
            // Delete PrayerRequestID and Data from prayerRequests/{prayerRequestID}
            let ref3 =
            db.collection("prayerRequests").document(post.id)
            try await ref3.delete()
            NetworkingLogger.debug("postOperations.deletePost.deleteFromPrayerRequests delete \(post.id)")
        } catch {
            NetworkingLogger.error("postOperations.deletePost.deleteFromPrayerRequests failed deleting \(post.id) \(error)")
        }
    }

    // this function updates the prayer requests collection carrying all prayer requests. Takes in the prayer request being updated, and the person who is being updated for.
    func updatePostsDataCollection(prayerRequest: Post, person: Person) async throws {
        let ref =
        db.collection("prayerRequests").document(prayerRequest.id)
        
        do{
            try await ref.updateData([
                "datePosted": prayerRequest.date,
                "firstName": prayerRequest.firstName,
                "lastName": prayerRequest.lastName,
                "status": prayerRequest.status.descriptionKey.capitalized,
                "postType": prayerRequest.postType.descriptionKey,
                "prayerRequestText": prayerRequest.postText,
                "userID": person.userID,
                "username": person.username,
                "privacy": prayerRequest.privacy.descriptionKey,
                "prayerRequestTitle": prayerRequest.postTitle
            ])
            NetworkingLogger.debug("postOperations.updatePostsDataCollection updated \(prayerRequest.id)")
        }catch {
            NetworkingLogger.error("postOperations.updatePostsDataCollection failed to update \(prayerRequest.id) \(error)")
        }
    }
}
