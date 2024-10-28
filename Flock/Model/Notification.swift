// Notification.swift
// Flock 
//
// Model for comment notifications
//
// Created by Ramon Jiang 10/26/24

import Foundation
import FirebaseFirestore // Add this import

struct Notification: Identifiable {
    var id: String
    let postID: String
    let postTitle: String
    let senderID: String
    let senderName: String
    let recipientID: String
    let type: NotificationType
    let timestamp: Date
    var isRead: Bool
    
    enum NotificationType: String {
        case newComment = "new_comment"
    }
    
    init?(id: String, data: [String: Any]) {
        guard 
            let postID = data["postID"] as? String,
            let postTitle = data["postTitle"] as? String,
            let senderID = data["senderID"] as? String,
            let senderName = data["senderName"] as? String,
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
        self.recipientID = recipientID
        self.type = type
        self.timestamp = timestamp.dateValue()
        self.isRead = isRead
    }
}