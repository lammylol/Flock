//
//  PrayerUpdateHelper.swift
//  Prayer Calendar
//
//  Created by Matt Lam on 2/18/24.
//

import Foundation
import FirebaseFirestore

class PostUpdateHelper {
    // this function gets all the prayer request updates from a specific prayer request passed through.
    func getPrayerRequestUpdates(prayerRequest: Post, person: Person) async throws -> [PostUpdate] {
        var updates = [PostUpdate]()
        let db = Firestore.firestore()
        
        guard prayerRequest.id != "" else {
            throw PrayerRequestRetrievalError.noPrayerRequestID
        }
        
        do {
            let prayerRequestUpdates = db.collection("prayerRequests").document(prayerRequest.id).collection("updates").order(by: "datePosted", descending: true)
            
            let querySnapshot = try await prayerRequestUpdates.getDocuments()
            
            for document in querySnapshot.documents {
                let timestamp = document.data()["datePosted"] as? Timestamp ?? Timestamp()
                let datePosted = timestamp.dateValue()
                
                let prayerRequestID = document.data()["prayerRequestID"] as? String ?? ""
                let prayerUpdateText = document.data()["prayerUpdateText"] as? String ?? ""
                let documentID = document.documentID as String
                let updateType = document.data()["updateType"] as? String ?? ""
                
                let prayerRequestUpdate = PostUpdate(id: documentID, postID: prayerRequestID, datePosted: datePosted, prayerUpdateText: prayerUpdateText, updateType: updateType)
                
                updates.append(prayerRequestUpdate)
            }
        } catch {
            NetworkingLogger.error("postUpdateHelper: Error getting documents: \(error)")
        }
        return updates
    }
    
    // this function enables the creation of an 'update' for an existing prayer request.
    func addPrayerRequestUpdate(datePosted: Date, post: Post, prayerRequestUpdate: PostUpdate, person: Person, friendsList: [Person]) async throws {
        let db = Firestore.firestore()
        
        // Add prayer request update into prayer request collection.
        let ref2 =
        db.collection("prayerRequests").document(post.id).collection("updates").document() // get prayer request collection
        
        try await ref2.setData([
            "datePosted": datePosted,
            "prayerRequestID": post.id,
            "prayerUpdateText": prayerRequestUpdate.prayerUpdateText,
            "updateType": prayerRequestUpdate.updateType
        ])
        
    // Add UpdateID and Data to prayerRequests/{prayerRequestID}/Updates
    // Reset latest update date and text for user id prayer list.
        let ref = db.collection("users").document(post.userID).collection("prayerList").document("\(person.userID)").collection("posts").document(post.id)
        
        try await ref.updateData([
            "latestUpdateDatePosted": datePosted,
            "latestUpdateText": prayerRequestUpdate.prayerUpdateText,
            "latestUpdateType": prayerRequestUpdate.updateType]
        )
        
        // update the latestUpdateDatePosted and latestUpdateText in prayer request collection.
        let refPrayerRequestCollection = db.collection("prayerRequests").document(post.id)
        
        try await refPrayerRequestCollection.updateData([
            "latestUpdateDatePosted": datePosted,
            "latestUpdateText": prayerRequestUpdate.prayerUpdateText,
            "latestUpdateType": prayerRequestUpdate.updateType]
        )
        
        // Add prayer request update to prayerFeed/{userID} main prayerRequest
        if post.privacy == .isPublic, !friendsList.isEmpty {
            for friend in friendsList {
                let refFriend = db.collection("prayerFeed").document(friend.userID).collection("prayerRequests").document(post.id)
                try await refFriend.updateData([
                    "latestUpdateDatePosted": prayerRequestUpdate.datePosted,
                    "latestUpdateText": prayerRequestUpdate.prayerUpdateText,
                    "latestUpdateType": prayerRequestUpdate.updateType,
                    "lastSeenNotificationCount": post.lastSeenNotificationCount + 1 // this defaults to false. once user takes action to view or select, notification goes true.
                ])
            }
        }
        
        // Add prayer Request to prayerFeed/{userID} for personal main user.
        let refProfile = db.collection("prayerFeed").document(person.userID).collection("prayerRequests").document(post.id)
        try await refProfile.updateData([
            "latestUpdateDatePosted": prayerRequestUpdate.datePosted,
            "latestUpdateText": prayerRequestUpdate.prayerUpdateText,
            "latestUpdateType": prayerRequestUpdate.updateType]
        )
    }
    
    //person passed in for the feed is the user. prayer passed in for the profile view is the person being viewed.
    func deletePostUpdate(post: Post, update: PostUpdate, updatesArray: [PostUpdate], person: Person, friendsList: [Person]) async throws {
        let db = Firestore.firestore()
        
        var lastSeenNotificationCount = post.lastSeenNotificationCount
        var updates = updatesArray
        updates.removeAll(where: {$0.id == update.id}) // must come first in order to make sure the prayer request last date posted can be factored correctly.
        
        // For resetting latest date and latest text.
        let latestUpdate = getLatestUpdate(post: post, updates: updates) // logic to determine the latest update date, text, and type by comparing against the full array of updates.
        if latestUpdate.0 < post.latestUpdateDatePosted {
            lastSeenNotificationCount = max(post.lastSeenNotificationCount - 1, 0) // ensures if it's negative, it returns 0.
        }
        let latestUpdateDatePosted = latestUpdate.0
        let latestUpdateText = latestUpdate.1
        let latestUpdateType = latestUpdate.2
        
//      Reset latest update date and text for user id prayer list.
        let ref = db.collection("users").document(post.userID).collection("prayerList").document("\(person.userID)").collection("posts").document(post.id)
        
        try await ref.updateData([
            "latestUpdateDatePosted": latestUpdateDatePosted,
            "latestUpdateText": latestUpdateText,
            "latestUpdateType": latestUpdateType
        ]
        )
        
        // update the latestUpdateDatePosted and latestUpdateText in prayer request collection.
        let refPrayerRequestCollection = db.collection("prayerRequests").document(post.id)
        
        try await refPrayerRequestCollection.updateData([
            "latestUpdateDatePosted": latestUpdateDatePosted,
            "latestUpdateText": latestUpdateText,
            "latestUpdateType": latestUpdateType]
        )
        
        // Update PrayerRequestID from prayerFeed/{userID}
        if post.privacy == .isPublic, !friendsList.isEmpty {
            for friend in friendsList {
                let refFriend = db.collection("prayerFeed").document(friend.userID).collection("prayerRequests").document(post.id)
                try await refFriend.updateData([
                    "latestUpdateDatePosted": latestUpdateDatePosted,
                    "latestUpdateText": latestUpdateText,
                    "latestUpdateType": latestUpdateType,
                    "lastSeenNotificationCount": lastSeenNotificationCount
                ])
            }
        }
        
        // Update from personal feed.
        let refProfile = db.collection("prayerFeed").document(person.userID).collection("prayerRequests").document(post.id)
        try await refProfile.updateData([
            "latestUpdateDatePosted": latestUpdateDatePosted,
            "latestUpdateText": latestUpdateText,
            "latestUpdateType": latestUpdateType]
        )
        
        //----------------- delete prayer update from collection ---------------------
        
        // Delete prayer update from prayerRequests/{prayerRequestID}
        let refUpdate =
        db.collection("prayerRequests").document(post.id).collection("updates").document(update.id)
        
        try await refUpdate.delete()
    }
    
    // A function to always find the latest update datePosted. Particularly if an update is deleted, the function needs to find what the latest date was to repost to.
    func getLatestUpdate(post: Post, updates: [PostUpdate]) -> (Date, String, String) {
        var latestUpdateDatePosted = Date()
        var latestUpdateText = ""
        var latestUpdateType = ""
        
        if updates.count >= 1 {
            // if there are more than 1 updates, then get datePosted of the latest update.
            // assume the array is sorted already on getPrayerUpdates
            let updates = updates.sorted(by: {$0.datePosted > $1.datePosted})
            print("getLatestUpdate - original latest update: \(post.latestUpdateDatePosted)")
            print("postUpdates: \(updates.map({$0.datePosted}).description)")
            
            latestUpdateDatePosted = updates.first?.datePosted ?? Date() // first since it's the earliest date
            latestUpdateText = updates.first?.prayerUpdateText ?? ""
            latestUpdateType = updates.first?.updateType ?? ""
        } else {
            // if either there are no updates, or there will be no updates after delete, then get datePosted of the original prayer request.
            latestUpdateDatePosted = post.date
            latestUpdateText = ""
            latestUpdateType = ""
        }
        
        return (latestUpdateDatePosted, latestUpdateText, latestUpdateType)
    }
    
    //person passed in for the feed is the user. prayer passed in for the profile view is the person being viewed.
    func editPrayerUpdate(post: Post, prayerRequestUpdate: PostUpdate, person: Person, friendsList: [Person], updatesArray: [PostUpdate]) async throws {
        let db = Firestore.firestore()
        
        let latestUpdateDatePosted = getLatestUpdate(post: post, updates: updatesArray).0
        
        if prayerRequestUpdate.datePosted == latestUpdateDatePosted  { // Only update latestUpdate to PrayerRequest if it is newer than the last.
            //      Reset latest update date and text for user id prayer list.
            let ref = db.collection("users").document(post.userID).collection("prayerList").document("\(person.userID)").collection("posts").document(post.id)
            
            try await ref.updateData([
                "latestUpdateDatePosted": prayerRequestUpdate.datePosted,
                "latestUpdateText": prayerRequestUpdate.prayerUpdateText,
                "latestUpdateType": prayerRequestUpdate.updateType
            ])
            
            // update the latestUpdateDatePosted and latestUpdateText in prayer request collection.
            let refPrayerRequestCollection = db.collection("prayerRequests").document(post.id)
            
            try await refPrayerRequestCollection.updateData([
                "latestUpdateDatePosted": prayerRequestUpdate.datePosted,
                "latestUpdateText": prayerRequestUpdate.prayerUpdateText,
                "latestUpdateType": prayerRequestUpdate.updateType]
            )
            
            // Update PrayerRequestID in prayerFeed/{userID}
            if post.privacy == .isPublic, !friendsList.isEmpty {
                for friend in friendsList {
                    let refFriend = db.collection("prayerFeed").document(friend.userID).collection("prayerRequests").document(post.id)
                    try await refFriend.updateData([
                        "latestUpdateDatePosted": prayerRequestUpdate.datePosted,
                        "latestUpdateText": prayerRequestUpdate.prayerUpdateText,
                        "latestUpdateType": prayerRequestUpdate.updateType]
                    )
                }
            }
            
            // Update your own feed.
            let refProfile = db.collection("prayerFeed").document(person.userID).collection("prayerRequests").document(post.id)
            try await refProfile.updateData([
                "latestUpdateDatePosted": prayerRequestUpdate.datePosted,
                "latestUpdateText": prayerRequestUpdate.prayerUpdateText,
                "latestUpdateType": prayerRequestUpdate.updateType]
            )
        }
        
        //----------------- Update prayer update in collection ---------------------
        
        // Update prayer update in prayerRequests/{prayerRequestID}
        let refUpdate =
        db.collection("prayerRequests").document(post.id).collection("updates").document(prayerRequestUpdate.id)
        
        try await refUpdate.updateData([
            "prayerUpdateText": prayerRequestUpdate.prayerUpdateText,
            "updateType": prayerRequestUpdate.updateType
        ])
    }
}
