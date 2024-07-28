// this will handle user and friend feeds

// created 07/27/24

import Foundation
import SwiftUI
import FirebaseFirestore
import FirebaseFunctions

enum PrayerRequestRetrievalError: Error {
    case noUserID
    case noPrayerRequestID
    case noPrayerRequest
    case errorRetrievingFromFirebase
}

class FeedService {
    private let db = Firestore.firestore()

    func updateFriendsFeed(post: Post, person: Person, friend: Person, updateFriend: Bool) async throws {
        // Implementation here
    }

    func deleteFromFeed(post: Post, person: Person, friendsList: [Person]) {
        // Implementation here
    }

    func publicToPrivate(post: Post, friendsList: [Person]) {
        // Implementation here
    }
}