// CommentViewModel.swift
// Flock 
//
// Handles logic for comment operations and manages the state of comments for a given post
//
// Created by Ramon Jiang 09/07/24

import SwiftUI
import FirebaseFirestore
import Foundation
import Combine
import Observation

@Observable class CommentViewModel {
    private let commentHelper = CommentHelper()
    private let postOperationsService = PostOperationsService()
    private let notificationHelper = NotificationHelper()
    private let person: Person
    var comments: [Comment] = []
    var isLoading = false
    var isLoadingMore = false
    var errorMessage: String?
    var scrollToEnd: Bool = false
    var hasMoreComments = true
    let commentsPerPage = 3  // Changed from private to public
    
    private var currentPostID: String?
    private var lastCommentSnapshot: QueryDocumentSnapshot?
    
    init(person: Person) {
        self.person = person
    }

    func fetchInitialComments(for postID: String) async {
        guard !postID.isEmpty else {
            print("Attempted to fetch comments with empty postID")
            return
        }
        
        print("Fetching initial comments for post: \(postID)")
        DispatchQueue.main.async {
            self.isLoading = true
            self.errorMessage = nil
            self.comments = []
            self.hasMoreComments = true
            self.lastCommentSnapshot = nil
        }
        currentPostID = postID
        
        do {
            let result = try await commentHelper.getComments(
                for: postID,
                limit: commentsPerPage,
                lastCommentSnapshot: nil
            )
            
            print("Fetched initial \(result.comments.count) comments")
            
            DispatchQueue.main.async {
                if self.currentPostID == postID {
                    self.comments = result.comments
                    self.lastCommentSnapshot = result.lastSnapshot
                    self.hasMoreComments = result.comments.count == self.commentsPerPage && result.lastSnapshot != nil
                    self.isLoading = false
                }
            }
        } catch {
            print("Error fetching initial comments: \(error)")
            DispatchQueue.main.async {
                self.errorMessage = "Failed to fetch comments: \(error.localizedDescription)"
                self.isLoading = false
            }
        }
    }
    
    func fetchMoreComments() async {
        guard let postID = currentPostID,
              !isLoadingMore,
              hasMoreComments,
              let lastSnapshot = lastCommentSnapshot else {
            print("Skipping fetchMoreComments - conditions not met")
            return
        }
        
        print("Fetching more comments after \(comments.count) comments")
        
        DispatchQueue.main.async {
            self.isLoadingMore = true
        }
        
        do {
            let result = try await commentHelper.getComments(
                for: postID,
                limit: commentsPerPage,
                lastCommentSnapshot: lastSnapshot
            )
            
            print("Fetched additional \(result.comments.count) comments")
            
            DispatchQueue.main.async {
                if self.currentPostID == postID {
                    self.comments.append(contentsOf: result.comments)
                    self.lastCommentSnapshot = result.lastSnapshot
                    self.hasMoreComments = result.comments.count == self.commentsPerPage && result.lastSnapshot != nil
                }
                self.isLoadingMore = false
            }
        } catch {
            print("Error fetching more comments: \(error)")
            DispatchQueue.main.async {
                self.errorMessage = "Failed to fetch more comments: \(error.localizedDescription)"
                self.isLoadingMore = false
            }
        }
    }
    
    func addComment(postID: String, text: String) async throws {
        // Input validation
        guard !text.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty else {
            print("Attempted to add empty comment")
            DispatchQueue.main.async {
                self.errorMessage = "Comment text cannot be empty"
            }
            return
        }
        
        print("Adding comment to post: \(postID)")
        DispatchQueue.main.async {
            self.isLoading = true
            self.errorMessage = nil
        }
        
        let newComment = Comment(
            postID: postID,
            userID: person.userID,
            username: person.username,
            firstName: person.firstName,
            lastName: person.lastName,
            text: text,
            createdAt: Date()
        )
        
        do {
            try await commentHelper.addComment(to: postID, comment: newComment)
            print("Comment added successfully")
            
            // Get unique previous commenters
            let previousCommenters = Set(comments.map { $0.userID })
            
            // Send notifications to post owner and other commenters
            if let postOwnerId = comments.first?.userID, postOwnerId != person.userID {
                try await notificationHelper.createNotification(
                    for: newComment,
                    postTitle: "", // PostFullView already has the post title
                    recipientID: postOwnerId
                )
            }
            
            // Notify previous commenters
            for commenterID in previousCommenters where commenterID != person.userID {
                try await notificationHelper.createNotification(
                    for: newComment,
                    postTitle: "", // PostFullView already has the post title
                    recipientID: commenterID
                )
            }
            
            await fetchInitialComments(for: postID)
        } catch {
            print("Error adding comment: \(error)")
            DispatchQueue.main.async {
                self.errorMessage = "Failed to add comment: \(error.localizedDescription)"
                self.isLoading = false
            }
            throw error  // Re-throw the error for the calling function to handle
        }
    }
    
    func updateComment(postID: String, comment: Comment) async {
        print("Updating comment: \(comment.id) in post: \(postID)")
        DispatchQueue.main.async {
            self.isLoading = true
            self.errorMessage = nil
        }
        
        do {
            try await commentHelper.updateComment(postID: postID, comment: comment)
            print("Comment updated successfully")
            await fetchInitialComments(for: postID)
        } catch {
            print("Error updating comment: \(error)")
            DispatchQueue.main.async {
                self.errorMessage = "Failed to update comment: \(error.localizedDescription)"
                self.isLoading = false
            }
        }
    }
    
    func refreshComments() async {
        guard let postID = currentPostID else { 
            print("No current post ID, cannot refresh comments")
            return 
        }
        print("Refreshing comments for post: \(postID)")
        await fetchInitialComments(for: postID)
    }

    func deleteComment(postID: String, commentID: String) async {
        print("Deleting comment: \(commentID) from post: \(postID)")
        DispatchQueue.main.async {
            self.isLoading = true
            self.errorMessage = nil
        }
        
        do {
            try await commentHelper.deleteComment(postID: postID, commentID: commentID)
            print("Comment deleted successfully")
            await fetchInitialComments(for: postID)
        } catch {
            print("Error deleting comment: \(error)")
            DispatchQueue.main.async {
                self.errorMessage = "Failed to delete comment: \(error.localizedDescription)"
                self.isLoading = false
            }
        }
    }
}
