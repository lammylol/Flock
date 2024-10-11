// Comment.swift
// Flock 
//
// Model for adding comments to posts
//
// Created by Ramon Jiang 09/07/24

import Foundation
import FirebaseFirestore

struct Comment: Identifiable, Codable {
    @DocumentID var id: String?
    var postID: String
    var userID: String
    var username: String
    var text: String
    var createdAt: Date
    
    enum CodingKeys: String, CodingKey {
        case id
        case postID
        case userID
        case username
        case text
        case createdAt
    }
}

extension Comment {
    static var preview: Comment {
        let item = Comment(
            postID: "123",
            userID: "345",
            username: "jimmy",
            text: "This is a comment",
            createdAt: Date()
        )
        return item
    }
}
