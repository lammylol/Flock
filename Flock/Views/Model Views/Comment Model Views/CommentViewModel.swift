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
    
    private var lastCommentSnapshot: QueryDocumentSnapshot?
    
    init(person: Person, post: Post) {
        self.person = person
        self.post = post
        
        // Fetch initial comments when initialized
        Task {
            await fetchInitialComments()
        }
    }

    func fetchInitialComments() async {
        print("Fetching initial comments for post: \(post.id)")
        DispatchQueue.main.async {
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
            
            print("Fetched initial \(result.comments.count) comments")
            
            DispatchQueue.main.async {
                self.comments = result.comments
                self.lastCommentSnapshot = result.lastSnapshot
                self.hasMoreComments = result.comments.count == self.commentsPerPage && result.lastSnapshot != nil
                self.isLoading = false
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
        guard !isLoadingMore,
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
                for: post.id,
                limit: commentsPerPage,
                lastCommentSnapshot: lastSnapshot
            )
            
            print("Fetched additional \(result.comments.count) comments")
            
            DispatchQueue.main.async {
                self.comments.append(contentsOf: result.comments)
                self.lastCommentSnapshot = result.lastSnapshot
                self.hasMoreComments = result.comments.count == self.commentsPerPage && result.lastSnapshot != nil
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
    
    func addComment(text: String) async throws {
        // Input validation
        guard !text.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty else {
            print("Attempted to add empty comment")
            DispatchQueue.main.async {
                self.errorMessage = "Comment text cannot be empty"
            }
            return
        }
        
        print("Adding comment to post: \(post.id)")
        DispatchQueue.main.async {
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
            print("Comment added successfully")
            
            // Get unique commenters from current page
            let commentersIds = Set(comments.map { $0.userID })
            print("DEBUG: Current page commenters: \(commentersIds)")
            
            // Combine post owner and commenters
            var uniqueRecipients = commentersIds
            uniqueRecipients.insert(post.userID)
            print("DEBUG: All recipients including owner: \(uniqueRecipients)")
            
            // Send notifications to everyone except the commenter
            for recipientID in uniqueRecipients where recipientID != person.userID {
                try await notificationHelper.createNotification(
                    for: newComment,
                    postTitle: post.postTitle,
                    recipientID: recipientID
                )
            }
            
            await fetchInitialComments()
        } catch {
            print("Error adding comment: \(error)")
            DispatchQueue.main.async {
                self.errorMessage = "Failed to add comment: \(error.localizedDescription)"
                self.isLoading = false
            }
            throw error
        }
    }
    
    func deleteComment(commentID: String) async {
        print("Deleting comment: \(commentID) from post: \(post.id)")
        DispatchQueue.main.async {
            self.isLoading = true
            self.errorMessage = nil
        }
        
        do {
            try await commentHelper.deleteComment(postID: post.id, commentID: commentID)
            print("Comment deleted successfully")
            await fetchInitialComments()
        } catch {
            print("Error deleting comment: \(error)")
            DispatchQueue.main.async {
                self.errorMessage = "Failed to delete comment: \(error.localizedDescription)"
                self.isLoading = false
            }
        }
    }
}
