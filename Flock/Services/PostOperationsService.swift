// Handles essential post CRUD operations

import Foundation
import FirebaseFirestore

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
                let postType = document.data()["postType"] as? String ?? "note"
                let status = document.data()["status"] as? String ?? ""
                let userID = document.data()["userID"] as? String ?? ""
                let username = document.data()["username"] as? String ?? ""
                let privacy = document.data()["privacy"] as? String ?? "private"
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

    func getPost(prayerRequest: Post) async throws -> Post {
        guard prayerRequest.id != "" else {
            throw PrayerRequestRetrievalError.noPrayerRequestID
        }
        
        let ref = db.collection("prayerRequests").document(prayerRequest.id)
        let isPinned = prayerRequest.isPinned // Need to save separately because isPinned is not stored in larger 'prayer requests' collection. Only within a user's feed.
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
                let postType = document.data()?["postType"] as? String ?? "note"
                let status = document.data()?["status"] as? String ?? ""
                let userID = document.data()?["userID"] as? String ?? ""
                let username = document.data()?["username"] as? String ?? ""
                let privacy = document.data()?["privacy"] as? String ?? "private"
                let documentID = document.documentID as String
                let latestUpdateText = document.data()?["latestUpdateText"] as? String ?? ""
                let latestUpdateType = document.data()?["latestUpdateType"] as? String ?? ""
            
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
        NetworkingLogger.debug("postOperations.getPost got \(prayerRequest.id) \(prayerRequest.privacy) \(prayerRequest.userID, privacy: .private)")
        return prayerRequest
    }

    // this function enables the creation and submission of a new prayer request. It does three things: 1) add to user collection of prayer requests, 2) add to prayer requests collection, and 3) adds the prayer request to all friends of the person only if the prayer request is the user's main profile.
    func createPost(userID: String, datePosted: Date, person: Person, postText: String, postTitle: String, privacy: String, postType: String, friendsList: [Person], isPinned: Bool) async throws {
        
        let postTitle = postTitle.capitalized
        var prayerRequestID = ""
        do {
            // Create new PrayerRequestID to users/{userID}/prayerList/{person}/prayerRequests
            let ref = db.collection("users").document(userID).collection("prayerList").document("\(person.firstName.lowercased())_\(person.lastName.lowercased())").collection("prayerRequests").document()
            
            try await ref.setData([
                "datePosted": datePosted,
                "firstName": person.firstName,
                "lastName": person.lastName,
                "status": "Current",
                "prayerRequestText": postText,
                "postType": postType,
                "userID": userID,
                "username": person.username,
                "privacy": privacy,
                "prayerRequestTitle": postTitle,
                "latestUpdateText": "",
                "latestUpdateDatePosted": datePosted,
                "latestUpdateType": "",
                "isPinned": isPinned
            ])
            
            prayerRequestID = ref.documentID
            NetworkingLogger.debug("postOperations.createPost.createPrayerRequestID created prayerRequestID \(prayerRequestID) \(userID)")
        }catch {
            NetworkingLogger.error("postOperations.createPost.createPrayerRequestID failed to create a PrayerRequestID \(userID, privacy: .private)")
        }
        
        do{
            guard(prayerRequestID != "") else {
                throw PrayerRequestRetrievalError.noPrayerRequestID
            }
            // Add PrayerRequestID to prayerFeed/{userID}
            if privacy == "public" && !friendsList.isEmpty {
                for friend in friendsList {
                    let ref2 = db.collection("prayerFeed").document(friend.userID).collection("prayerRequests").document(prayerRequestID)
                    try await ref2.setData([
                        "datePosted": datePosted,
                        "firstName": person.firstName,
                        "lastName": person.lastName,
                        "status": "Current",
                        "prayerRequestText": postText,
                        "postType": postType,
                        "userID": userID,
                        "username": person.username,
                        "privacy": privacy,
                        "prayerRequestTitle": postTitle,
                        "latestUpdateText": "",
                        "latestUpdateDatePosted": datePosted,
                        "latestUpdateType": "",
                        "lastSeenNotificationCount": 1 // this defaults to 1. once user takes action to view or select, notification goes to 0. if update is added, notification goes to +1.
                    ])
                } // If you have friends and have set privacy to public, this will update all friends feeds.
            }
            let ref2 = db.collection("prayerFeed").document(userID).collection("prayerRequests").document(prayerRequestID)
            try await ref2.setData([
                "datePosted": datePosted,
                "firstName": person.firstName,
                "lastName": person.lastName,
                "status": "Current",
                "prayerRequestText": postText,
                "postType": postType,
                "userID": userID,
                "username": person.username,
                "privacy": privacy,
                "prayerRequestTitle": postTitle,
                "latestUpdateText": "",
                "latestUpdateDatePosted": datePosted,
                "latestUpdateType": "",
                "isPinned": isPinned
            ]) // if the prayer is for a local user, it will update your own feed.
            NetworkingLogger.debug("postOperations.createPost.addToPrayerFeed added to prayerFeed")
        }catch{
            NetworkingLogger.error("postOperations.createPost.addToPrayerFeed failed")
        }
            
        do{
            // Add PrayerRequestID and Data to prayerRequests/{prayerRequestID}
            let ref3 =
            db.collection("prayerRequests").document(prayerRequestID)
            
            try await ref3.setData([
                "datePosted": datePosted,
                "firstName": person.firstName,
                "lastName": person.lastName,
                "status": "Current",
                "prayerRequestText": postText,
                "postType": postType,
                "userID": userID,
                "username": person.username,
                "privacy": privacy,
                "prayerRequestTitle": postTitle,
                "latestUpdateText": "",
                "latestUpdateDatePosted": datePosted,
                "latestUpdateType": ""
            ])
            NetworkingLogger.debug("postOperations.createPost.addToPrayerRequests \(userID, privacy: .private) created \(prayerRequestID)")
        }catch{
            NetworkingLogger.error("postOperations.createPost.addToPrayerRequests failed to create for \(userID, privacy: .private)")
        }
    }

    // This function enables an edit to a prayer requests off of a selected prayer request.
    func editPost(post: Post, person: Person, friendsList: [Person]) async throws {
        do {
            let ref = db.collection("users").document(person.userID).collection("prayerList").document("\(post.firstName.lowercased())_\(post.lastName.lowercased())").collection("prayerRequests").document(post.id)
            
            try await ref.updateData([
                "datePosted": post.date,
                "status": post.status,
                "postType": post.postType,
                "prayerRequestText": post.postText,
                "privacy": post.privacy,
                "prayerRequestTitle": post.postTitle,
                "isPinned": post.isPinned
            ])
            
            // Add PrayerRequestID to prayerFeed/{userID}
            if post.status == "No Longer Needed" {
                try await FeedService().deleteFromFeed(post: post, person: person, friendsList: friendsList) // If it is no longer needed, remove from all feeds. If not, update all feeds.
                NetworkingLogger.debug("postOperations.editPost - \(post.id) removed from all feeds")
            } else {
                if post.privacy == "public" && friendsList.isEmpty == false {
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
                "status": prayerRequest.status,
                "postType": prayerRequest.postType,
                "prayerRequestText": prayerRequest.postText,
                "userID": person.userID,
                "username": person.username,
                "privacy": prayerRequest.privacy,
                "prayerRequestTitle": prayerRequest.postTitle
            ])
            NetworkingLogger.debug("postOperations.updatePostsDataCollection updated \(prayerRequest.id)")
        }catch {
            NetworkingLogger.error("postOperations.updatePostsDataCollection failed to update \(prayerRequest.id) \(error)")
        }
    }
}
