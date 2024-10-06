// CommentHelper.swift
// Flock
//
// Helper class for comment-related Firebase operations
//
// Created by Ramon Jiang 09/07/24

import Foundation
import FirebaseFirestore

class CommentHelper {
    private let db = Firestore.firestore()
    
    // Add a new comment to a post
    func addComment(to postID: String, comment: Comment) async throws {
        try validatePostID(postID)
        
        let postRef = db.collection("prayerRequests").document(postID)
        let commentRef = postRef.collection("comments").document()
        
        var newComment = comment
        newComment.id = commentRef.documentID
        
        try await commentRef.setData(from: newComment)
    }
    
    // Retrieve comments for a post
    func getComments(for postID: String, limit: Int = 20, lastCommentDate: Date? = nil) async throws -> [Comment] {
        print("CommentHelper: Getting comments for post ID: \(postID)")
        try validatePostID(postID)
        
        var query = db.collection("prayerRequests").document(postID).collection("comments")
            .order(by: "createdAt", descending: true)
            .limit(to: limit)
        
        if let lastCommentDate = lastCommentDate {
            query = query.start(after: [lastCommentDate])
        }
        
        print("CommentHelper: Executing Firestore query")
        let snapshot = try await query.getDocuments()
        print("CommentHelper: Query completed, document count: \(snapshot.documents.count)")
        
        let comments = snapshot.documents.compactMap { try? $0.data(as: Comment.self) }
        print("CommentHelper: Parsed \(comments.count) comments")
        return comments
    }
    
    // Delete a comment
    func deleteComment(postID: String, commentID: String) async throws {
        try validatePostID(postID)
        try validateCommentID(commentID)
        
        let commentRef = db.collection("prayerRequests").document(postID).collection("comments").document(commentID)
        try await commentRef.delete()
    }
    
    // Update a comment
    func updateComment(postID: String, comment: Comment) async throws {
        try validatePostID(postID)
        guard let commentID = comment.id else {
            throw CommentError.invalidCommentID
        }
        try validateCommentID(commentID)
        
        let commentRef = db.collection("prayerRequests").document(postID).collection("comments").document(commentID)
        try await commentRef.setData(from: comment)
    }
    
    // Helper method to validate post ID
    private func validatePostID(_ postID: String) throws {
        guard !postID.isEmpty else {
            throw CommentError.invalidPostID
        }
    }
    
    // Helper method to validate comment ID
    private func validateCommentID(_ commentID: String) throws {
        guard !commentID.isEmpty else {
            throw CommentError.invalidCommentID
        }
    }
}

// Custom error enum for better error handling
enum CommentError: Error {
    case invalidPostID
    case invalidCommentID
    
    var localizedDescription: String {
        switch self {
        case .invalidPostID:
            return "Post ID cannot be empty"
        case .invalidCommentID:
            return "Comment ID is missing or empty"
        }
    }
}
