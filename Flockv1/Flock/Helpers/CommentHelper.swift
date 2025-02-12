// CommentHelper.swift
// Flock
//
// Helper class for comment-related Firebase operations
//
// Created by Ramon Jiang 09/07/24

import Foundation
import FirebaseFirestore
import FirebaseAuth

class CommentHelper {
    private let db = Firestore.firestore()
    
    // Add a new comment to a post
    func addComment(to postID: String, comment: Comment) async throws {
        print("AddComment Debug:")
        print("Current Auth UID: \(Auth.auth().currentUser?.uid ?? "none")")
        print("Post ID: \(postID)")
        print("Comment creator ID: \(comment.userID)")
        try validatePostID(postID)
        
        // Use the prayerRequests collection directly
        let commentRef = db.collection("prayerRequests")
            .document(postID)
            .collection("comments")
            .document()
        
        var newComment = comment
        newComment.id = commentRef.documentID
        
        try await commentRef.setData(from: newComment)
    }
    
    // Retrieve comments for a post with pagination
    func getComments(for postID: String, limit: Int = 3, lastCommentSnapshot: QueryDocumentSnapshot? = nil) async throws -> (comments: [Comment], lastSnapshot: QueryDocumentSnapshot?) {
        try validatePostID(postID)
        
        // Start with base query sorted by newest first
        var query = db.collection("prayerRequests")
            .document(postID)
            .collection("comments")
            .order(by: "createdAt", descending: true)
            .limit(to: limit)
        
        // Add pagination cursor if we have a last snapshot
        if let lastCommentSnapshot = lastCommentSnapshot {
            query = query.start(afterDocument: lastCommentSnapshot)
        }
        
        let snapshot = try await query.getDocuments()
        print("Fetched \(snapshot.documents.count) comments from Firestore")
        
        let comments = snapshot.documents.compactMap { try? $0.data(as: Comment.self) }
        let lastSnapshot = snapshot.documents.last
        
        return (comments: comments, lastSnapshot: lastSnapshot)
    }
    
    // Keep other methods the same but update their paths too
    func deleteComment(postID: String, commentID: String) async throws {
        try validatePostID(postID)
        try validateCommentID(commentID)
        
        let commentRef = db.collection("prayerRequests")
            .document(postID)
            .collection("comments")
            .document(commentID)
            
        try await commentRef.delete()
    }
    
    func updateComment(postID: String, comment: Comment) async throws {
        try validatePostID(postID)
        guard let commentID = comment.id else {
            throw CommentError.invalidCommentID
        }
        try validateCommentID(commentID)
        
        let commentRef = db.collection("prayerRequests")
            .document(postID)
            .collection("comments")
            .document(commentID)
            
        try await commentRef.setData(from: comment)
    }
    
    // Keep existing validation methods
    private func validatePostID(_ postID: String) throws {
        guard !postID.isEmpty else {
            throw CommentError.invalidPostID
        }
    }
    
    private func validateCommentID(_ commentID: String) throws {
        guard !commentID.isEmpty else {
            throw CommentError.invalidCommentID
        }
    }
}

// Keep existing CommentError enum
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
