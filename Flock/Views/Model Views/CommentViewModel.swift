// CommentViewModel.swift
// Flock 
//
// Handles logic for comment operations and manages the state of comments for a given post
//
// Created by Ramon Jiang 09/07/24

import Foundation
import Combine

import Foundation
import Combine

class CommentViewModel: ObservableObject {
    private let commentHelper = CommentHelper()
    @Published var comments: [Comment] = []
    @Published var isLoading = false
    @Published var errorMessage: String?
    
    private var cancellables = Set<AnyCancellable>()
    
    func fetchComments(for postID: String) {
        isLoading = true
        errorMessage = nil
        
        Task { @MainActor in
            do {
                comments = try await commentHelper.getComments(for: postID)
            } catch {
                errorMessage = "Failed to fetch comments: \(error.localizedDescription)"
            }
            isLoading = false
        }
    }
    
    func addComment(to postID: String, text: String, user: User) {
        guard !text.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty else {
            errorMessage = "Comment text cannot be empty"
            return
        }
        
        isLoading = true
        errorMessage = nil
        
        let newComment = Comment(postID: postID, userID: user.id, username: user.username, text: text, createdAt: Date())
        
        Task { @MainActor in
            do {
                try await commentHelper.addComment(to: postID, comment: newComment)
                await fetchComments(for: postID)
            } catch {
                errorMessage = "Failed to add comment: \(error.localizedDescription)"
                isLoading = false
            }
        }
    }
    
    func deleteComment(postID: String, commentID: String) {
        isLoading = true
        errorMessage = nil
        
        Task { @MainActor in
            do {
                try await commentHelper.deleteComment(postID: postID, commentID: commentID)
                await fetchComments(for: postID)
            } catch {
                errorMessage = "Failed to delete comment: \(error.localizedDescription)"
                isLoading = false
            }
        }
    }
    
    func updateComment(postID: String, comment: Comment) {
        isLoading = true
        errorMessage = nil
        
        Task { @MainActor in
            do {
                try await commentHelper.updateComment(postID: postID, comment: comment)
                await fetchComments(for: postID)
            } catch {
                errorMessage = "Failed to update comment: \(error.localizedDescription)"
                isLoading = false
            }
        }
    }
}
