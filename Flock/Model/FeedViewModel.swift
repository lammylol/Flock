//
//  PrayerRequestViewModel.swift
//  Prayer Calendar
//
//  Created by Matt Lam on 4/15/24.
//

import Foundation
import SwiftUI
import FirebaseFirestore

@Observable class FeedViewModel {
    var posts: [Post] = []
    var lastDocument: DocumentSnapshot? = nil
    var selectedStatus: statusFilter = .current
    var person: Person = Person()
    var scrollViewID = UUID()
    var progressStatus: Bool = false
    var refresh: Bool = false
    var viewState: ViewState?
    var queryCount: Int = 0
    var profileOrFeed: String = ""
//    var pinnedPosts: [Post] = []
    
    var feedService = FeedService()
    
    init(profileOrFeed: String = "") {
        self.profileOrFeed = profileOrFeed
    }
    
    var isLoading: Bool {
        viewState == .loading
    }
    
    var isFetching: Bool {
        viewState == .fetching
    }
    
    var isFinished: Bool {
        viewState == .finished
    }
    
    enum statusFilter: String, CaseIterable {
        case answered = "answered"
        case current = "current"
        case noLongerNeeded = "no longer needed"
        case pinned = "pinned"
        case none
        
        var statusKey: String {
            return self.rawValue.description
        }
    }
    
    // Fetch posts based on the filter
    @MainActor
    func statusFilter(option: statusFilter, user: Person, person: Person, profileOrFeed: String) async throws {
//        self.selectedStatus = option
        self.lastDocument = nil
        self.posts = []
        try await self.getPosts(user: user, person: person)
    }
    
    // Main function to get posts
    @MainActor
    func getPosts(user: Person, person: Person) async throws {
        do {
            self.viewState = .loading
            
            defer {
                self.viewState = .finished
            }
            
            // Validate user ID or person ID before making Firestore calls
            guard !user.userID.isEmpty || !person.userID.isEmpty else {
                throw PersonRetrievalError.noUserID
            }
            
            let (newPrayerRequests, lastDocument) = try await feedService.getPostFeed(user: user, person: person, answeredFilter: selectedStatus.statusKey, count: 10, lastDocument: nil, profileOrFeed: profileOrFeed)
            
            self.posts = newPrayerRequests
            self.queryCount = newPrayerRequests.count
            
            if lastDocument != nil {
                self.lastDocument = lastDocument
            }
            
            ModelLogger.debug("FeedViewModel.getPost last document \(lastDocument?.documentID ?? "n/a")")
        } catch {
            ModelLogger.error("FeedViewModel.getPosts failed \(error)")
        }
    }
    
//    func getPinnedPosts(user: Person, person: Person) async {
//        do {
//            let (newPosts, lastDocument) = try await feedService.getPostFeed(user: user, person: person, answeredFilter: "pinned", count: 100, lastDocument: nil, profileOrFeed: profileOrFeed)
//            
//            pinnedPosts = newPosts
//            // not adding 'last document' yet. Assuming pinned posts will never get that long.
//            
//            ModelLogger.debug("FeedViewModel.getPinnedPosts last document \(lastDocument?.documentID ?? "n/a")")
//        } catch {
//            ModelLogger.error("FeedViewModel.getPinnedPosts failed \(error)")
//        }
//        
//    }
    
    // Fetch more posts for pagination
    @MainActor
    func getNextPosts(user: Person, person: Person, profileOrFeed: String) async {
        self.viewState = .fetching
        
        defer {
            self.viewState = .finished
        }
        
        guard queryCount == 10 else { return }
        
        do {
            let (newPrayerRequests, lastDocument) = try await feedService.getPostFeed(user: user, person: person, answeredFilter: selectedStatus.statusKey, count: 10, lastDocument: lastDocument, profileOrFeed: profileOrFeed)
            
            self.queryCount = newPrayerRequests.count
            self.posts.append(contentsOf: newPrayerRequests)
            
            if lastDocument != nil {
                self.lastDocument = lastDocument
            }
            
            ModelLogger.debug("FeedViewModel.getNextPrayerRequests last document: \(lastDocument?.documentID ?? "n/a")")
        } catch {
            ModelLogger.error("\(error.localizedDescription)")
        }
    }
    
    func hasReachedEnd(of prayerRequest: Post) -> Bool {
        posts.last?.id == prayerRequest.id
    }
}

extension FeedViewModel {
    enum ViewState {
        case fetching
        case loading
        case finished
    }
}

@Observable final class PinnedFeedViewModel: FeedViewModel {
    override init(profileOrFeed: String = "") {
        super.init(profileOrFeed: profileOrFeed)
        self.selectedStatus = .pinned // Initialize with pinned status
    }

    // You can add any additional functionality specific to pinned posts here
}
