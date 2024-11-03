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
    
    // These should trigger UI updates when changed
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
    
    func fetchInitialComments() async {
        print("fetchInitialComments started")
        guard isValid else {
            print("fetchInitialComments - invalid state")
            await MainActor.run {
                self.errorMessage = "Cannot fetch comments: invalid post or user data"
                self.isLoading = false
            }
            return
        }
        
        print("fetchInitialComments - state valid, proceeding to fetch")
        await MainActor.run {
            self.isLoading = true
            self.errorMessage = nil
            self.comments = []
            self.hasMoreComments = false
            self.lastCommentSnapshot = nil
        }
        
        do {
            print("fetchInitialComments - calling commentHelper.getComments")
            let result = try await commentHelper.getComments(
                for: post.id,
                limit: commentsPerPage + 1
            )
            
            await MainActor.run {
                let allFetchedComments = result.comments
                print("Fetched \(allFetchedComments.count) total comments")
                
                // Only take the first commentsPerPage documents
                self.comments = Array(allFetchedComments.prefix(commentsPerPage))
                print("Displaying first \(self.comments.count) comments")
                
                // Set hasMoreComments based on whether we received an extra document
                self.hasMoreComments = allFetchedComments.count > commentsPerPage
                print("Has more comments: \(self.hasMoreComments)")
                
                // Store the last snapshot if we have more comments
                if self.hasMoreComments {
                    self.lastCommentSnapshot = result.lastSnapshot
                    print("Stored last snapshot for pagination")
                }
                
                self.isLoading = false
                
                // Print debug info
                self.comments.forEach { comment in
                    print("""
                        Comment in ViewModel:
                        ID: \(comment.id ?? "no id")
                        Text: \(comment.text)
                        Author: \(comment.firstName) \(comment.lastName)
                        """)
                }
                
                // Print pagination state
                print("""
                    Pagination State:
                    - Has more comments: \(self.hasMoreComments)
                    - Last snapshot exists: \(self.lastCommentSnapshot != nil)
                    - Comments count: \(self.comments.count)
                    """)
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
        print("""
            fetchMoreComments check:
            - isLoadingMore: \(!isLoadingMore)
            - hasMoreComments: \(hasMoreComments)
            - lastSnapshot exists: \(lastCommentSnapshot != nil)
            """)
        
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
                limit: commentsPerPage + 1,
                lastCommentSnapshot: lastSnapshot
            )
            
            await MainActor.run {
                let newComments = result.comments
                print("Fetched \(newComments.count) new comments")
                
                // Only take the first commentsPerPage documents
                let commentsToAdd = Array(newComments.prefix(commentsPerPage))
                self.comments.append(contentsOf: commentsToAdd)
                print("Added \(commentsToAdd.count) comments to display")
                
                // Update pagination state
                self.hasMoreComments = newComments.count > commentsPerPage
                if self.hasMoreComments {
                    self.lastCommentSnapshot = result.lastSnapshot
                    print("Updated last snapshot for next page")
                }
                
                self.isLoadingMore = false
                
                // Print final state
                print("""
                    Updated Pagination State:
                    - Has more comments: \(self.hasMoreComments)
                    - Last snapshot exists: \(self.lastCommentSnapshot != nil)
                    - Total comments count: \(self.comments.count)
                    """)
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

    func deleteComment(commentID: String) async {
        print("deleteComment started - commentID: \(commentID)")
        // Validate state before proceeding
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