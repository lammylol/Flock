// CommentViewModel.swift
// Flock 
//
// Handles logic for comment operations and manages the state of comments for a given post
//
// Created by Ramon Jiang 09/07/24

import Foundation
import Combine
import SwiftUI

@Observable class CommentViewModel {
    private let commentHelper = CommentHelper()
    var comments: [Comment] = []
    var isLoading = false
    var errorMessage: String?
    var scrollToEnd: Bool = false
    
    private var currentPostID: String?
    
    func fetchComments(for postID: String) async {
        guard !postID.isEmpty else {
            print("Attempted to fetch comments with empty postID")
            return
        }
        
        print("Fetching comments for post: \(postID)")
        DispatchQueue.main.async {
            self.isLoading = true
            self.errorMessage = nil
        }
        currentPostID = postID
        
        do {
            let fetchedComments = try await commentHelper.getComments(for: postID)
            print("Fetched \(fetchedComments.count) comments for post \(postID)")
            DispatchQueue.main.async {
                // Only update if this is still the current post we're interested in
                if self.currentPostID == postID {
                    self.comments = fetchedComments.sorted { $0.createdAt < $1.createdAt }
                    self.isLoading = false
                    print("Updated comments in ViewModel: \(self.comments.count) for post \(postID)")
                } else {
                    print("Discarded fetched comments for post \(postID) as it's no longer current")
                }
            }
        } catch {
            print("Error fetching comments for post \(postID): \(error)")
            DispatchQueue.main.async {
                if self.currentPostID == postID {
                    self.errorMessage = "Failed to fetch comments: \(error.localizedDescription)"
                    self.isLoading = false
                }
            }
        }
    }
    
    func addComment(to postID: String, text: String, person: Person) async {
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
            await fetchComments(for: postID)
        } catch {
            print("Error adding comment: \(error)")
            DispatchQueue.main.async {
                self.errorMessage = "Failed to add comment: \(error.localizedDescription)"
                self.isLoading = false
            }
        }
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
            await fetchComments(for: postID)
        } catch {
            print("Error deleting comment: \(error)")
            DispatchQueue.main.async {
                self.errorMessage = "Failed to delete comment: \(error.localizedDescription)"
                self.isLoading = false
            }
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
            await fetchComments(for: postID)
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
        await fetchComments(for: postID)
    }
}
