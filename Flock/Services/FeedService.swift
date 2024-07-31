//
//  FeedService.swift
//  Flock
//
//  Created by Preston Mar on 7/24/24.
//

import Foundation
import FirebaseFirestore

// db stuff to support the feed
class FeedService {
    private let db = Firestore.firestore()
    
    private func collectionPath(for user: Person, person: Person, profileOrFeed: String) -> CollectionReference {
        if profileOrFeed == "feed" {
            return db.collection("prayerFeed").document(user.userID).collection("prayerRequests")
        } else {
            let personDocID = "\(person.firstName.lowercased())_\(person.lastName.lowercased())"
            return db.collection("users").document(person.userID).collection("prayerList").document(personDocID).collection("prayerRequests")
        }
    }
    
    func getAllPostsQuery(user: Person, person: Person, profileOrFeed: String) -> Query {
        return collectionPath(for: user, person: person, profileOrFeed: profileOrFeed)
    }
    
    func getAllPostsByStatusQuery(user: Person, person: Person, status: String, profileOrFeed: String) -> Query {
        let collection = collectionPath(for: user, person: person, profileOrFeed: profileOrFeed)
        var query = collection.whereField("status", isEqualTo: status).order(by: "latestUpdateDatePosted", descending: true)
        
        if profileOrFeed != "feed" && person.userID != user.userID {
            query = query.whereField("privacy", isEqualTo: "public")
        }
        
        return query
    }
    
    func getPosts(querySnapshot: QuerySnapshot) -> ([Post], DocumentSnapshot?) {
        var posts = [Post]()
        var lastDocument: DocumentSnapshot? = nil
        
        for document in querySnapshot.documents {
            let data = document.data()
            let timestamp = data["datePosted"] as? Timestamp ?? Timestamp()
            let updateTimestamp = data["latestUpdateDatePosted"] as? Timestamp ?? timestamp
            
            let post = Post(
                id: document.documentID,
                date: timestamp.dateValue(),
                userID: data["userID"] as? String ?? "",
                username: data["username"] as? String ?? "",
                firstName: data["firstName"] as? String ?? "",
                lastName: data["lastName"] as? String ?? "",
                postTitle: data["prayerRequestTitle"] as? String ?? "",
                postText: data["prayerRequestText"] as? String ?? "",
                postType: data["postType"] as? String ?? "",
                status: data["status"] as? String ?? "",
                latestUpdateText: data["latestUpdateText"] as? String ?? "",
                latestUpdateDatePosted: updateTimestamp.dateValue(),
                latestUpdateType: data["latestUpdateType"] as? String ?? "",
                privacy: data["privacy"] as? String ?? "private",
                isPinned: data["isPinned"] as? Bool ?? false
            )
            
            posts.append(post)
        }
        
        lastDocument = querySnapshot.documents.last
        return (posts, lastDocument)
    }
    
    func getPostFeed(user: Person, person: Person, answeredFilter: String, count: Int, lastDocument: DocumentSnapshot?, profileOrFeed: String) async throws -> ([Post], DocumentSnapshot?) {
        let prayerFeed: Query
        
        switch answeredFilter {
        case "answered":
            prayerFeed = getAllPostsByStatusQuery(user: user, person: person, status: "Answered", profileOrFeed: profileOrFeed)
        case "current":
            prayerFeed = getAllPostsByStatusQuery(user: user, person: person, status: "Current", profileOrFeed: profileOrFeed)
        case "no longer needed":
            prayerFeed = getAllPostsByStatusQuery(user: user, person: person, status: "No Longer Needed", profileOrFeed: profileOrFeed)
        case "pinned":
            prayerFeed = getAllPostsQuery(user: user, person: person, profileOrFeed: profileOrFeed)
                .whereField("isPinned", isEqualTo: true)
                .order(by: "latestUpdateDatePosted", descending: true)
        default:
            prayerFeed = getAllPostsQuery(user: user, person: person, profileOrFeed: profileOrFeed)
                .order(by: "latestUpdateDatePosted", descending: true)
        }
        
        let querySnapshot: QuerySnapshot
        
        if let lastDoc = lastDocument {
            querySnapshot = try await prayerFeed.start(afterDocument: lastDoc).limit(to: count).getDocuments()
        } else {
            querySnapshot = try await prayerFeed.limit(to: count).getDocuments()
        }
        
        return getPosts(querySnapshot: querySnapshot)
    }
}
