//
//  FeedService.swift
//  Flock
//
//  Created by Preston Mar & Ramon Jiang on 7/24/24.
//

import Foundation
import FirebaseFirestore

// this will handle user and friend feeds
class FeedService {
    private let db = Firestore.firestore()

    private func collectionPath(for user: Person, person: Person?, viewType: FeedViewModel.ViewType) -> CollectionReference {
        if let person = person, viewType == .profile, person.userID == user.userID {
            let personDocID = "\(person.firstName.lowercased())_\(person.lastName.lowercased())"
            return db.collection("users").document(person.userID).collection("prayerList").document(personDocID).collection("prayerRequests")
        } else {
            return db.collection("prayerFeed").document(user.userID).collection("prayerRequests")
        }
    }

    func getAllPostsQuery(user: Person, person: Person?, status: FeedViewModel.StatusFilter, viewType: FeedViewModel.ViewType, selectionType: FeedViewModel.SelectionType) -> Query {
        let collection = collectionPath(for: user, person: person, viewType: viewType)
        var query: Query
        
        query = collection.whereField("status", isEqualTo: status.statusKey.capitalized)

        // Additional filters based on viewType and selectionType
        switch viewType {
        case .today:
            if selectionType == .myFriendPostsPinned {
                query = query.whereField("isPinned", isEqualTo: true)
                             .whereField("lastName", isNotEqualTo: user.lastName)
            } else if selectionType == .myPostsPinned {
                query = query.whereField("isPinned", isEqualTo: true)
                             .whereField("userID", isEqualTo: user.userID)
                             .whereField("firstName", isEqualTo: user.firstName)
                             .whereField("lastName", isEqualTo: user.lastName)
            } else if selectionType == .myPosts {
                query = query.whereField("userID", isEqualTo: user.userID)
                             .whereField("firstName", isEqualTo: user.firstName)
                             .whereField("lastName", isEqualTo: user.lastName)
            }

        case .profile:
            if let person = person {
                if selectionType == .myPostsPinned {
                    query = query.whereField("isPinned", isEqualTo: true)
                        .whereField("userID", isEqualTo: person.userID)
                        .whereField("firstName", isEqualTo: person.firstName)
                        .whereField("lastName", isEqualTo: person.lastName)
                } else if selectionType == .myPosts {
                    query = query.whereField("userID", isEqualTo: person.userID)
                                 .whereField("firstName", isEqualTo: person.firstName)
                                 .whereField("lastName", isEqualTo: person.lastName)
                }
            }

        default:
            break
        }
        
        return query.order(by: "latestUpdateDatePosted", descending: true)
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
                postType: data["postType"] as? String ?? "note",
                status: data["status"] as? String ?? "",
                latestUpdateText: data["latestUpdateText"] as? String ?? "",
                latestUpdateDatePosted: updateTimestamp.dateValue(),
                latestUpdateType: data["latestUpdateType"] as? String ?? "",
                privacy: data["privacy"] as? String ?? "private",
                isPinned: data["isPinned"] as? Bool ?? false,
                lastSeenNotificationCount: data["lastSeenNotificationCount"] as? Int ?? 0
            )

            posts.append(post)
        }

        lastDocument = querySnapshot.documents.last
        return (posts, lastDocument)
    }

    func getPostFeed(user: Person, person: Person?, statusFilter: FeedViewModel.StatusFilter, count: Int, lastDocument: DocumentSnapshot?, viewType: FeedViewModel.ViewType, selectionType: FeedViewModel.SelectionType) async throws -> ([Post], DocumentSnapshot?) {
        let postFeed: Query
        
        postFeed = getAllPostsQuery(user: user, person: person ?? nil, status: statusFilter, viewType: viewType, selectionType: selectionType)

        let querySnapshot: QuerySnapshot

        if let lastDoc = lastDocument {
            querySnapshot = try await postFeed.start(afterDocument: lastDoc).limit(to: count).getDocuments()
        } else {
            querySnapshot = try await postFeed.limit(to: count).getDocuments()
        }

        return getPosts(querySnapshot: querySnapshot)
    }

    // This function updates the prayer feed of all users who are friends of the person.
    func updateFriendsFeed(post: Post, person: Person, friend: Person, updateFriend: Bool) async throws {
        do {
            let userID = updateFriend ? friend.userID : person.userID
            let ref = db.collection("prayerFeed").document(userID).collection("prayerRequests").document(post.id)

            let data: [String: Any] = [
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
                "lastSeenNotificationCount": 0
            ]

            if updateFriend {
                if try await ref.getDocument().exists {
                    // Update only relevant fields for existing post
                    try await ref.updateData(data)
                } else {
                    // Add additional fields for new post
                    var newPostData = data
                    newPostData["isPinned"] = false
                    try await ref.setData(newPostData)
                }
            } else {
                // Set data for the person’s own post
                var ownPostData = data
                ownPostData["isPinned"] = post.isPinned
                try await ref.setData(ownPostData)
            }

        } catch {
            NetworkingLogger.error("FeedService.updateFriendsFeed failed \(error)")
        }
    }
    
    // This function is used only for deleting from prayer feed. ie. No longer needed, or deleted prayer request.
    func deleteFromFeed(post: Post, person: Person, friendsList: [Person]) async throws {
        do{
            // Delete PrayerRequestID from prayerFeed/{userID}
            if post.privacy == "public" && friendsList.isEmpty == false {
                for friend in friendsList {
                    let ref = db.collection("prayerFeed").document(friend.userID).collection("prayerRequests").document(post.id)
                    try await ref.delete()
                }
            } // Delete from your friends' feeds.
        }catch{
            NetworkingLogger.error("FeedService.deleteFromFeed. Failed to delete from friends feed \(error)")
        }
        
        do{
            // Delete from your own user feed.
            let ref2 = db.collection("prayerFeed").document(person.userID).collection("prayerRequests").document(post.id)
            try await ref2.delete()
        }catch{
            NetworkingLogger.error("FeedService.deleteFromFeed failed to delete from user feed \(error)")
        }
    }

    func publicToPrivate(post: Post, friendsList: [Person]) async throws {
        do{
            if friendsList.isEmpty == false {
                for friend in friendsList {
                    let ref2 = db.collection("prayerFeed").document(friend.userID).collection("prayerRequests").document(post.id)
                    try await ref2.delete()
                }
            }
        } catch{
            NetworkingLogger.error("FeedService.publicToPrivate failed \(error)")
        }
    } // This function allows you to pass in a prayer request and delete that from friends' feeds if you have changed it from public to private.
    
    func updateLastSeenNotificationCount(post: Post, person: Person) async throws {
        do {
            let ref = db.collection("prayerFeed").document(person.userID).collection("prayerRequests").document(post.id)
            try await ref.updateData([
                "lastSeenNotificationCount": 0 // always return to 0 once it's seen, since user is pulling up the full update list
            ])
            NetworkingLogger.info("FeedService.updateLastNotificationCount: updated last seen notification count to 0")
        } catch {
            NetworkingLogger.error("FeedService.updateLastNotificationCount failed \(error)")
        }
    } // This function allows you to pass in a prayer request and delete that from friends' feeds if you have changed it from public to private.
}
