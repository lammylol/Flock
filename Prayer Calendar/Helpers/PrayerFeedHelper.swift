//
//  PrayerFeedHelper.swift
//  Prayer Calendar
//
//  Created by Matt Lam on 1/28/24.
//

import Foundation
import FirebaseFirestore
import SwiftUI

class PrayerFeedHelper {
    let db = Firestore.firestore()
    
    func getAllPrayerRequestsQuery(user: Person, person: Person, profileOrFeed: String) -> Query {
        if profileOrFeed == "feed" {
            db.collection("prayerFeed").document(user.userID).collection("prayerRequests")
        } else {
            db.collection("users").document(person.userID).collection("prayerList").document("\(person.firstName.lowercased())_\(person.lastName.lowercased())").collection("prayerRequests")
        }
    }
    
    func getAllPrayerRequestsByStatusQuery(user: Person, person: Person, status: String, profileOrFeed: String) -> Query {
        if profileOrFeed == "feed" {
            db.collection("prayerFeed").document(user.userID).collection("prayerRequests")
                .whereField("status", isEqualTo: status)
                .order(by: "latestUpdateDatePosted", descending: true)
        } else {
            db.collection("users").document(person.userID).collection("prayerList").document("\(person.firstName.lowercased())_\(person.lastName.lowercased())").collection("prayerRequests")
                .whereField("status", isEqualTo: status)
                .order(by: "latestUpdateDatePosted", descending: true)
        }
    }
    
    func getPosts(querySnapshot: QuerySnapshot) -> ([Post], DocumentSnapshot?) {
        var posts = [Post]()
        var lastDocument: DocumentSnapshot? = nil
        
        if !querySnapshot.isEmpty {
            for document in querySnapshot.documents {
                let timestamp = document.data()["datePosted"] as? Timestamp ?? Timestamp()
                let datePosted = timestamp.dateValue()
                let firstName = document.data()["firstName"] as? String ?? ""
                let lastName = document.data()["lastName"] as? String ?? ""
                let status = document.data()["status"] as? String ?? ""
                let userID = document.data()["userID"] as? String ?? ""
                let username = document.data()["username"] as? String ?? ""
                let privacy = document.data()["privacy"] as? String ?? "private"
                let isPinned = document.data()["isPinned"] as? Bool ?? false
                let postTitle = document.data()["prayerRequestTitle"] as? String ?? ""
                let postText = document.data()["prayerRequestText"] as? String ?? ""
                let postType = document.data()["postTitle"] as? String ?? ""
                let documentID = document.documentID as String
                let latestUpdateText = document.data()["latestUpdateText"] as? String ?? ""
                let latestUpdateType = document.data()["latestUpdateType"] as? String ?? ""
                let updateTimestamp = document.data()["latestUpdateDatePosted"] as? Timestamp ?? timestamp
                let latestUpdateDatePosted = updateTimestamp.dateValue()
                
                let post = Post(
                    id: documentID,
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
                
                posts.append(post)
                print("post: "+post.id+"lastDocument: "+(querySnapshot.documents.last?.documentID ?? ""))
                lastDocument = querySnapshot.documents.last
            }
        }
        return (posts, lastDocument)
    }
    
    func getPrayerRequestFeed(user: Person, person: Person, answeredFilter: String, count: Int, lastDocument: DocumentSnapshot?, profileOrFeed: String) async throws -> ([Post], DocumentSnapshot?) {
        
        guard person.userID != "" else {
            throw PrayerRequestRetrievalError.noUserID
        }
        
        var prayerFeed: Query
        
        //answeredFilter is true if only filtering on answered prayers.
        if answeredFilter == "answered" {
            prayerFeed = getAllPrayerRequestsByStatusQuery(user: user, person: person, status: "Answered", profileOrFeed: profileOrFeed)
        } else if answeredFilter == "current" {
            prayerFeed = getAllPrayerRequestsByStatusQuery(user: user, person: person, status: "Current", profileOrFeed: profileOrFeed)
        } else if answeredFilter == "no longer needed" {
            prayerFeed = getAllPrayerRequestsByStatusQuery(user: user, person: person, status: "No Longer Needed", profileOrFeed: profileOrFeed)
        } else if answeredFilter == "pinned" { //if 'pinned'
            prayerFeed = getAllPrayerRequestsQuery(user: user, person: person, profileOrFeed: profileOrFeed)
                .whereField("isPinned", isEqualTo: true)
                .order(by: "latestUpdateDatePosted", descending: true)
        } else {
            prayerFeed = getAllPrayerRequestsQuery(user: user, person: person, profileOrFeed: profileOrFeed)
                .order(by: "latestUpdateDatePosted", descending: true)
        }
        
        var querySnapshot: QuerySnapshot
        
        if lastDocument != nil /*&& progressStatus == true*/ {
            querySnapshot =
            try await prayerFeed
                .limit(to: count)
                .start(afterDocument: lastDocument!)
                .getDocuments()
        } else {
            querySnapshot =
            try await prayerFeed
                .limit(to: count)
                .getDocuments()
        }
        
        print(querySnapshot.count)
        
        return getPosts(querySnapshot: querySnapshot)
    }
}
