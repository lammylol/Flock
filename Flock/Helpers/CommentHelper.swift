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
        let postRef = db.collection("posts").document(postID)
        let commentRef = postRef.collection("comments").document()
        
        var newComment = comment
        newComment.id = commentRef.documentID
        
        try commentRef.setData(from: newComment)
    }
    
    // Retrieve comments for a post
    func getComments(for postID: String, limit: Int = 20, lastCommentDate: Date? = nil) async throws -> [Comment] {
        var query = db.collection("posts").document(postID).collection("comments")
            .order(by: "createdAt", descending: true)
            .limit(to: limit)
        
        if let lastCommentDate = lastCommentDate {
            query = query.start(after: [lastCommentDate])
        }
        
        let snapshot = try await query.getDocuments()
        return snapshot.documents.compactMap { try? $0.data(as: Comment.self) }
    }
    
    // Delete a comment
    func deleteComment(postID: String, commentID: String) async throws {
        let postRef = db.collection("posts").document(postID)
        let commentRef = postRef.collection("comments").document(commentID)
        
        try await commentRef.delete()
    }
    
    // Update a comment
    func updateComment(postID: String, comment: Comment) async throws {
        guard let commentID = comment.id else {
            throw NSError(domain: "CommentError", code: 0, userInfo: [NSLocalizedDescriptionKey: "Comment ID is missing"])
        }
        
        let commentRef = db.collection("posts").document(postID).collection("comments").document(commentID)
        try commentRef.setData(from: comment)
    }
}
