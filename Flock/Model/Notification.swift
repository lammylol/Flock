// Notification.swift
// Flock 
//
// Model for comment notifications
//
// Created by Ramon Jiang 10/26/24

import Foundation

struct Notification: Identifiable, Codable {
    var id: String?
    let postID: String
    let postTitle: String
    let senderID: String
    let senderName: String
    let recipientID: String
    let type: NotificationType
    let timestamp: Date
    var isRead: Bool
    
    enum NotificationType: String, Codable {
        case newComment = "new_comment"
    }
}