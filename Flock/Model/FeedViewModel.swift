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
    var selectedStatus: StatusFilter = .current
    var person: Person = Person()
    var scrollViewID = UUID()
    var progressStatus: Bool = false
    var refresh: Bool = false
    var viewState: ViewState?
    var queryCount: Int = 0
    var viewType: ViewType = .feed // type of view being accessed. can be profile page, feed, or today page.
    var selectionType: SelectionType = .allPosts // type of selection being accessed. can be pinned, friendsPosts, or myPosts
    
    var feedService = FeedService()
    
    init(viewType: ViewType? = nil, selectionType: SelectionType? = nil) {
        if let viewType = viewType { self.viewType = viewType }
        if let selectionType = selectionType { self.selectionType = selectionType }
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
    
    enum StatusFilter: String, CaseIterable {
        case answered = "answered"
        case current = "current"
        case noLongerNeeded = "no longer needed"
        case pinned = "pinned"
        case none
        
        var statusKey: String {
            return self.rawValue.description
        }
    }
    
    enum SelectionType: CaseIterable {
        case myPosts // my posts only
        case myFriendPosts // my friends post, excluding mine
        case myPostsPinned // my pinned posts only
        case myFriendPostsPinned // my friends pinned posts, excluding mine
        case allPosts // all posts
    }
    
    enum ViewType: CaseIterable {
        case profile
        case feed
        case today
    }
    
    // Fetch posts based on the filter
    @MainActor
    func statusFilter(user: Person, person: Person) async throws {
        self.lastDocument = nil
        self.posts = []
        try await self.getPosts(user: user, person: person)
    }
    
    // Main function to get posts
    @MainActor
    func getPosts(user: Person, person: Person? = nil) async throws {
        do {
            self.viewState = .loading
            
            defer {
                self.viewState = .finished
            }
            
            // Validate user ID or person ID before making Firestore calls
            guard !user.userID.isEmpty, person?.userID.isEmpty != true else {
                throw PersonRetrievalError.noUserID
            }
            
            let (newPrayerRequests, lastDocument) = try await feedService.getPostFeed(user: user, person: person, statusFilter: selectedStatus, count: 10, lastDocument: nil, viewType: viewType, selectionType: selectionType)
            
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
    
    // Fetch more posts for pagination
    @MainActor
    func getNextPosts(user: Person, person: Person, profileOrFeed: String) async {
        self.viewState = .fetching
        
        defer {
            self.viewState = .finished
        }
        
        guard queryCount == 10 else { return }
        
        do {
            let (newPrayerRequests, lastDocument) = try await feedService.getPostFeed(user: user, person: person, statusFilter: selectedStatus, count: 10, lastDocument: lastDocument, viewType: viewType, selectionType: selectionType)
            
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
