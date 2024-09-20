// CommentViewModel.swift
// Flock 
//
// Handles logic for comment operations and manages the state of comments for a given post
//
// Created by Ramon Jiang 09/07/24

import Foundation
import Combine
import SwiftUI

@Observable final class CommentViewModel {
    private let commentHelper = CommentHelper()
    var comments: [Comment] = []
    var isLoading = false
    var errorMessage: String?
    
    private var currentPostID: String?
    
    func fetchComments(for postID: String) async {
        guard !isLoading else { return }
        
        isLoading = true
        errorMessage = nil
        currentPostID = postID
        
        do {
            comments = try await commentHelper.getComments(for: postID)
        } catch {
            errorMessage = "Failed to fetch comments: \(error.localizedDescription)"
        }
        
        isLoading = false
    }
    
    func addComment(to postID: String, text: String, person: Person) async {
        guard !text.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty else {
            errorMessage = "Comment text cannot be empty"
            return
        }
        
        isLoading = true
        errorMessage = nil
        
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
            errorMessage = "Failed to add comment: \(error.localizedDescription)"
            isLoading = false
        }
    }
    
    func deleteComment(postID: String, commentID: String) async {
        isLoading = true
        errorMessage = nil
        
        do {
            try await commentHelper.deleteComment(postID: postID, commentID: commentID)
            await fetchComments(for: postID)
        } catch {
            errorMessage = "Failed to delete comment: \(error.localizedDescription)"
            isLoading = false
        }
    }
    
    func updateComment(postID: String, comment: Comment) async {
        isLoading = true
        errorMessage = nil
        
        do {
            try await commentHelper.updateComment(postID: postID, comment: comment)
            await fetchComments(for: postID)
        } catch {
            errorMessage = "Failed to update comment: \(error.localizedDescription)"
            isLoading = false
        }
    }
    
    func refreshComments() async {
        guard let postID = currentPostID else { return }
        await fetchComments(for: postID)
    }
}
