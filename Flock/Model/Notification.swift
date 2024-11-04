// Notification.swift
// Flock 
//
// Model for comment notifications
//
// Created by Ramon Jiang 10/26/24

import Foundation
import FirebaseFirestore

struct Notification: Identifiable, Hashable, Codable {
    var id: String
    let postID: String
    let postTitle: String
    let senderID: String
    let senderName: String
    let senderUsername: String
    let recipientID: String
    let type: NotificationType
    let timestamp: Date
    var isRead: Bool
    
    enum NotificationType: String, Codable {
        case newComment = "new_comment"
    }
    
    enum CodingKeys: String, CodingKey {
        case id
        case postID
        case postTitle
        case senderID
        case senderName
        case senderUsername
        case recipientID
        case type
        case timestamp
        case isRead
    }
    
    init(id: String, postID: String, postTitle: String, senderID: String, senderName: String, senderUsername: String, recipientID: String, type: NotificationType, timestamp: Date, isRead: Bool) {
        self.id = id
        self.postID = postID
        self.postTitle = postTitle
        self.senderID = senderID
        self.senderName = senderName
        self.senderUsername = senderUsername
        self.recipientID = recipientID
        self.type = type
        self.timestamp = timestamp
        self.isRead = isRead
    }
    
    init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        
        id = try container.decodeIfPresent(String.self, forKey: .id) ?? ""
        postID = try container.decode(String.self, forKey: .postID)
        postTitle = try container.decode(String.self, forKey: .postTitle)
        senderID = try container.decode(String.self, forKey: .senderID)
        senderName = try container.decode(String.self, forKey: .senderName)
        senderUsername = try container.decode(String.self, forKey: .senderUsername)
        recipientID = try container.decode(String.self, forKey: .recipientID)
        
        // Handle Firestore Timestamp
        if let timestamp = try container.decodeIfPresent(Timestamp.self, forKey: .timestamp) {
            self.timestamp = timestamp.dateValue()
        } else {
            self.timestamp = Date()
        }
        
        // Decode type string and convert to enum
        if let typeString = try container.decodeIfPresent(String.self, forKey: .type),
           let type = NotificationType(rawValue: typeString) {
            self.type = type
        } else {
            self.type = .newComment // Default value
        }
        
        isRead = try container.decode(Bool.self, forKey: .isRead)
    }
    
    init?(id: String, data: [String: Any]) {
        guard 
            let postID = data["postID"] as? String,
            let postTitle = data["postTitle"] as? String,
            let senderID = data["senderID"] as? String,
            let senderName = data["senderName"] as? String,
            let senderUsername = data["senderUsername"] as? String,
            let recipientID = data["recipientID"] as? String,
            let typeString = data["type"] as? String,
            let timestamp = data["timestamp"] as? Timestamp,
            let isRead = data["isRead"] as? Bool,
            let type = NotificationType(rawValue: typeString)
        else {
            return nil
        }
        
        self.id = id
        self.postID = postID
        self.postTitle = postTitle
        self.senderID = senderID
        self.senderName = senderName
        self.senderUsername = senderUsername
        self.recipientID = recipientID
        self.type = type
        self.timestamp = timestamp.dateValue()
        self.isRead = isRead
    }
    
    func encode(to encoder: Encoder) throws {
        var container = encoder.container(keyedBy: CodingKeys.self)
        
        try container.encode(id, forKey: .id)
        try container.encode(postID, forKey: .postID)
        try container.encode(postTitle, forKey: .postTitle)
        try container.encode(senderID, forKey: .senderID)
        try container.encode(senderName, forKey: .senderName)
        try container.encode(recipientID, forKey: .recipientID)
        try container.encode(type.rawValue, forKey: .type)
        try container.encode(Timestamp(date: timestamp), forKey: .timestamp)
        try container.encode(isRead, forKey: .isRead)
    }
}
