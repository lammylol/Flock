import SwiftUI
import FirebaseFirestore
import Foundation
import Combine
import Observation

@Observable class CommentViewModel {
    // MARK: - Properties
    private let commentHelper = CommentHelper()
    private let notificationHelper = NotificationHelper()
    private let person: Person
    private let post: Post
    
    @ObservationIgnored private var lastCommentSnapshot: QueryDocumentSnapshot?
    @ObservationIgnored private var isInitialized = false
    
    var comments: [Comment] = []
    var isLoading = false
    var isLoadingMore = false
    var errorMessage: String?
    var hasMoreComments = false
    var scrollToEnd: Bool = false
    
    // Updated pagination values
    let initialLoadSize = 10  // Show first 10 comments
    let commentsPerPage = 5   // Load 5 more at a time
    
    @ObservationIgnored private var hasCompletedInitialLoad = false
    
    // MARK: - Initialization
    init(person: Person, post: Post) {
        print("CommentViewModel.init - Post ID: \(post.id)")
        print("CommentViewModel.init - Person ID: \(person.userID)")
        self.person = person
        self.post = post
        
        guard isValid else {
            print("CommentViewModel.init - Invalid initialization")
            errorMessage = "Invalid initialization data"
            return
        }
        
        print("CommentViewModel.init - Successfully initialized")
        isInitialized = true
    }
    
    private var isValid: Bool {
        return !post.id.isEmpty && !person.userID.isEmpty
    }

    // MARK: - Comment Loading
    func fetchInitialComments() async {
        guard isValid else {
            print("fetchInitialComments - invalid state")
            await MainActor.run {
                self.errorMessage = "Cannot fetch comments: invalid post or user data"
                self.isLoading = false
            }
            return
        }
        
        print("fetchInitialComments - starting fetch")
        await MainActor.run {
            self.isLoading = true
            self.errorMessage = nil
            self.comments = []
            self.lastCommentSnapshot = nil
        }
        
        do {
            print("fetchInitialComments - fetching with limit: \(initialLoadSize + 1)")
            let result = try await commentHelper.getComments(
                for: post.id,
                limit: initialLoadSize + 1
            )
            
            await MainActor.run {
                if result.comments.count > initialLoadSize {
                    // Got more than initial load size, indicate more are available
                    let displayedComments = Array(result.comments.prefix(initialLoadSize))
                    self.comments = displayedComments
                    self.hasMoreComments = true
                    self.lastCommentSnapshot = result.lastSnapshot
                    print("Initial load: Showing first \(displayedComments.count) comments, more available")
                } else {
                    // Got less than or equal to initial load size, show all
                    self.comments = result.comments
                    self.hasMoreComments = false
                    print("Initial load: Showing all \(self.comments.count) comments, no more available")
                }
                self.hasCompletedInitialLoad = true
                self.isLoading = false
            }
        } catch {
            print("Error fetching initial comments: \(error)")
            await MainActor.run {
                self.errorMessage = "Failed to fetch comments: \(error.localizedDescription)"
                self.isLoading = false
            }
        }
    }
    
    func fetchMoreComments() async {
        guard !isLoadingMore,
              hasMoreComments,
              let lastSnapshot = lastCommentSnapshot else {
            print("fetchMoreComments - conditions not met")
            return
        }
        
        print("fetchMoreComments - fetching next page of \(commentsPerPage)")
        await MainActor.run {
            self.isLoadingMore = true
        }
        
        do {
            let result = try await commentHelper.getComments(
                for: post.id,
                limit: commentsPerPage + 1,
                lastCommentSnapshot: lastSnapshot
            )
            
            await MainActor.run {
                if result.comments.count > commentsPerPage {
                    // More comments exist after this batch
                    let newComments = Array(result.comments.prefix(commentsPerPage))
                    self.comments.append(contentsOf: newComments)
                    self.hasMoreComments = true
                    self.lastCommentSnapshot = result.lastSnapshot
                    print("Loaded more: Added \(newComments.count) comments, more available")
                } else {
                    // This is the last batch
                    self.comments.append(contentsOf: result.comments)
                    self.hasMoreComments = false
                    print("Loaded more: Added final \(result.comments.count) comments, no more available")
                }
                self.isLoadingMore = false
            }
        } catch {
            print("Error fetching more comments: \(error)")
            await MainActor.run {
                self.errorMessage = "Failed to fetch more comments: \(error.localizedDescription)"
                self.isLoadingMore = false
            }
        }
    }
    
    func addComment(text: String) async throws {
        guard isValid && isInitialized else {
            throw CommentError.invalidPostID
        }
        
        await MainActor.run {
            self.isLoading = true
            self.errorMessage = nil
        }
        
        let newComment = Comment(
            postID: post.id,
            userID: person.userID,
            username: person.username,
            firstName: person.firstName,
            lastName: person.lastName,
            text: text,
            createdAt: Date()
        )
        
        do {
            try await commentHelper.addComment(to: post.id, comment: newComment)
            
            // Get unique commenters for notifications
            let commentersIds = Set(comments.map { $0.userID })
            var uniqueRecipients = commentersIds
            uniqueRecipients.insert(post.userID)
            
            for recipientID in uniqueRecipients where recipientID != person.userID {
                try await notificationHelper.createNotification(
                    for: newComment,
                    postTitle: post.postTitle,
                    recipientID: recipientID
                )
            }
            
            // Refresh comments after adding new one
            await fetchInitialComments()
        } catch {
            await MainActor.run {
                self.errorMessage = "Failed to add comment: \(error.localizedDescription)"
                self.isLoading = false
            }
            throw error
        }
    }
    
    func deleteComment(commentID: String) async {
        print("deleteComment started - commentID: \(commentID)")
        guard isValid && isInitialized else {
            print("deleteComment - invalid state")
            await MainActor.run {
                self.errorMessage = "Cannot delete comment: invalid state"
            }
            return
        }
        
        await MainActor.run {
            self.isLoading = true
            self.errorMessage = nil
        }
        
        do {
            print("Attempting to delete comment \(commentID) from post \(post.id)")
            try await commentHelper.deleteComment(postID: post.id, commentID: commentID)
            
            // Optimistically remove the comment from the local array
            await MainActor.run {
                self.comments.removeAll { $0.id == commentID }
                print("Comment removed locally - remaining comments: \(self.comments.count)")
            }
            
            // Refresh comments to ensure sync with server
            await fetchInitialComments()
        } catch {
            print("Error deleting comment: \(error)")
            await MainActor.run {
                self.errorMessage = "Failed to delete comment: \(error.localizedDescription)"
                self.isLoading = false
            }
        }
    }
}