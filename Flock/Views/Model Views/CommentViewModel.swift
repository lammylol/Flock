// CommentViewModel.swift
// Flock 
//
// Handles logic for comment operations and manages the state of comments for a given post
//
// Created by Ramon Jiang 09/07/24

import Foundation
import Combine
import SwiftUI

class CommentViewModel: ObservableObject {
    private let commentHelper = CommentHelper()
    @Published var comments: [Comment] = []
    @Published var isLoading = false
    @Published var errorMessage: String?
    
    private var currentPostID: String?
    
    func fetchComments(for postID: String) async {
        guard !isLoading else { return }
        
        DispatchQueue.main.async {
            self.isLoading = true
            self.errorMessage = nil
        }
        currentPostID = postID
        
        do {
            let fetchedComments = try await commentHelper.getComments(for: postID)
            DispatchQueue.main.async {
                self.comments = fetchedComments.sorted { $0.createdAt < $1.createdAt }
                self.isLoading = false
            }
        } catch {
            DispatchQueue.main.async {
                self.errorMessage = "Failed to fetch comments: \(error.localizedDescription)"
                self.isLoading = false
            }
        }
        
        DispatchQueue.main.async {
            self.isLoading = false
        }
    }
    
    func addComment(to postID: String, text: String, person: Person) async {
        guard !text.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty else {
            DispatchQueue.main.async {
                self.errorMessage = "Comment text cannot be empty"
            }
            return
        }
        
        DispatchQueue.main.async {
            self.isLoading = true
            self.errorMessage = nil
        }
        
        let newComment = Comment(
            postID: postID,
            userID: person.userID,
            username: person.username,
            text: text,
            createdAt: Date()
        )
        
        do {
            try await commentHelper.addComment(to: postID, comment: newComment)
            await fetchComments(for: postID)
        } catch {
            DispatchQueue.main.async {
                self.errorMessage = "Failed to add comment: \(error.localizedDescription)"
            }
        }
        
        DispatchQueue.main.async {
            self.isLoading = false
        }
    }
    
    func deleteComment(postID: String, commentID: String) async {
        DispatchQueue.main.async {
            self.isLoading = true
            self.errorMessage = nil
        }
        
        do {
            try await commentHelper.deleteComment(postID: postID, commentID: commentID)
            await fetchComments(for: postID)
        } catch {
            DispatchQueue.main.async {
                self.errorMessage = "Failed to delete comment: \(error.localizedDescription)"
                self.isLoading = false
            }
        }
    }
    
    func updateComment(postID: String, comment: Comment) async {
        DispatchQueue.main.async {
            self.isLoading = true
            self.errorMessage = nil
        }
        
        do {
            try await commentHelper.updateComment(postID: postID, comment: comment)
            await fetchComments(for: postID)
        } catch {
            DispatchQueue.main.async {
                self.errorMessage = "Failed to update comment: \(error.localizedDescription)"
                self.isLoading = false
            }
        }
    }
    
    func refreshComments() async {
        guard let postID = currentPostID else { return }
        await fetchComments(for: postID)
    }
}
