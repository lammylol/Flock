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
    
    var comments: [Comment] = []
    var isLoading = false
    var isLoadingMore = false
    var errorMessage: String?
    var scrollToEnd: Bool = false
    var hasMoreComments = true
    let commentsPerPage = 3
    
    // Track initialization and validation state
    private var isInitialized = false
    private var isValid: Bool {
        return !post.id.isEmpty && !person.userID.isEmpty
    }
    
    private var lastCommentSnapshot: QueryDocumentSnapshot?
    
    // MARK: - Initialization
    init(person: Person, post: Post) {
        print("CommentViewModel.init - Post ID: \(post.id)")
        print("CommentViewModel.init - Person ID: \(person.userID)")
        self.person = person
        self.post = post
        
        guard isValid else {
            print("CommentViewModel.init - Invalid initialization: Post ID empty: \(post.id.isEmpty), Person ID empty: \(person.userID.isEmpty)")
            errorMessage = "Invalid initialization data: \(post.id.isEmpty ? "missing post ID" : "missing user ID")"
            return
        }
        
        print("CommentViewModel.init - Successfully initialized")
        isInitialized = true
    }

    // MARK: - Public Methods
    func deleteComment(commentID: String) async {
        // Validate state before proceeding
        guard isValid && isInitialized else {
            await MainActor.run {
                self.errorMessage = "Cannot delete comment: invalid state"
            }
            return
        }
        
        // Validate commentID exists in current comments
        guard comments.contains(where: { $0.id == commentID }) else {
            await MainActor.run {
                self.errorMessage = "Cannot delete comment: comment not found"
            }
            return
        }
        
        await MainActor.run {
            self.isLoading = true
            self.errorMessage = nil
        }
        
        do {
            try await commentHelper.deleteComment(postID: post.id, commentID: commentID)
            
            // Optimistically remove the comment from the local array
            await MainActor.run {
                self.comments.removeAll { $0.id == commentID }
                self.isLoading = false
            }
            
            // Refresh comments to ensure sync with server
            await fetchInitialComments()
        } catch CommentError.invalidPostID {
            await MainActor.run {
                self.errorMessage = "Invalid post ID"
                self.isLoading = false
            }
        } catch CommentError.invalidCommentID {
            await MainActor.run {
                self.errorMessage = "Invalid comment ID"
                self.isLoading = false
            }
        } catch {
            await MainActor.run {
                self.errorMessage = "Failed to delete comment: \(error.localizedDescription)"
                self.isLoading = false
            }
        }
    }

    func fetchInitialComments() async {
        // Validate state before proceeding
        guard isValid else {
            await MainActor.run {
                self.errorMessage = "Cannot fetch comments: invalid post or user data"
                self.isLoading = false
            }
            return
        }
        
        guard isInitialized else {
            await MainActor.run {
                self.errorMessage = "ViewModel not properly initialized"
                self.isLoading = false
            }
            return
        }
        
        print("Fetching initial comments for post: \(post.id)")
        
        await MainActor.run {
            self.isLoading = true
            self.errorMessage = nil
            self.comments = []
            self.hasMoreComments = true
            self.lastCommentSnapshot = nil
        }
        
        do {
            let result = try await commentHelper.getComments(
                for: post.id,
                limit: commentsPerPage,
                lastCommentSnapshot: nil
            )
            
            await MainActor.run {
                self.comments = result.comments
                self.lastCommentSnapshot = result.lastSnapshot
                self.hasMoreComments = result.comments.count == self.commentsPerPage && result.lastSnapshot != nil
                self.isLoading = false
                
                if result.comments.isEmpty {
                    print("No comments found for post")
                }
            }
        } catch CommentError.invalidPostID {
            await MainActor.run {
                self.errorMessage = "Invalid post ID"
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
        // Validate state and conditions for fetching more
        guard isValid && isInitialized else {
            await MainActor.run {
                self.errorMessage = "Cannot fetch more comments: invalid state"
            }
            return
        }
        
        guard !isLoadingMore,
              hasMoreComments,
              let lastSnapshot = lastCommentSnapshot else {
            print("Skipping fetchMoreComments - conditions not met")
            return
        }
        
        await MainActor.run {
            self.isLoadingMore = true
        }
        
        do {
            let result = try await commentHelper.getComments(
                for: post.id,
                limit: commentsPerPage,
                lastCommentSnapshot: lastSnapshot
            )
            
            await MainActor.run {
                self.comments.append(contentsOf: result.comments)
                self.lastCommentSnapshot = result.lastSnapshot
                self.hasMoreComments = result.comments.count == self.commentsPerPage && result.lastSnapshot != nil
                self.isLoadingMore = false
            }
        } catch CommentError.invalidPostID {
            await MainActor.run {
                self.errorMessage = "Invalid post ID"
                self.isLoadingMore = false
            }
        } catch {
            await MainActor.run {
                self.errorMessage = "Failed to fetch more comments: \(error.localizedDescription)"
                self.isLoadingMore = false
            }
        }
    }
    
    func addComment(text: String) async throws {
        // Validate state and input
        guard isValid && isInitialized else {
            throw CommentError.invalidPostID
        }
        
        guard !text.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty else {
            throw CommentError.invalidCommentID // Using this error type for empty text
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
            // Add the comment
            try await commentHelper.addComment(to: post.id, comment: newComment)
            
            // Get unique commenters for notifications
            let commentersIds = Set(comments.map { $0.userID })
            var uniqueRecipients = commentersIds
            uniqueRecipients.insert(post.userID)
            
            // Send notifications
            for recipientID in uniqueRecipients where recipientID != person.userID {
                try await notificationHelper.createNotification(
                    for: newComment,
                    postTitle: post.postTitle,
                    recipientID: recipientID
                )
            }
            
            // Refresh comments
            await fetchInitialComments()
        } catch {
            await MainActor.run {
                self.errorMessage = "Failed to add comment: \(error.localizedDescription)"
                self.isLoading = false
            }
            throw error
        }
    }
}