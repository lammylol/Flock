// Notification.swift
// Flock 
//
// Handles Firestore operations for notifications
//
// Created by Ramon Jiang 10/26/24

import Foundation
import FirebaseFirestore

enum NotificationError: Error {
    case firestoreError(Error)
    case invalidData
}

class NotificationHelper {
    private static let db = Firestore.firestore()
    private static let notificationsCollection = "notifications"
    
    static func createNotification(for comment: Comment, postTitle: String, recipientID: String) async throws {
        let notification = Notification(
            postID: comment.postID,
            postTitle: postTitle,
            senderID: comment.userID,
            senderName: "\(comment.firstName) \(comment.lastName)",
            recipientID: recipientID,
            type: .newComment,
            timestamp: Date(),
            isRead: false
        )
        
        try await db.collection(notificationsCollection)
            .document(recipientID)
            .collection("userNotifications")
            .addDocument(from: notification)
    }
    
    static func listenForNotifications(userID: String, completion: @escaping (Result<[Notification], NotificationError>) -> Void) {
        db.collection(notificationsCollection)
            .whereField("recipientID", isEqualTo: userID)
            .addSnapshotListener { snapshot, error in
                if let error = error {
                    completion(.failure(.firestoreError(error)))
                    return
                }
                
                guard let documents = snapshot?.documents else {
                    completion(.failure(.invalidData))
                    return
                }
                
                let notifications = documents.compactMap { document -> Notification? in
                    try? document.data(as: Notification.self)
                }
                
                completion(.success(notifications))
            }
    }
    
    static func markNotificationAsRead(notificationID: String) async {
        try? await db.collection(notificationsCollection)
            .document(notificationID)
            .updateData(["isRead": true])
    }
    
    static func markAllNotificationsAsRead(userID: String) async {
        let batch = db.batch()
        let notifications = try? await db.collection(notificationsCollection)
            .whereField("recipientID", isEqualTo: userID)
            .whereField("isRead", isEqualTo: false)
            .getDocuments()
        
        notifications?.documents.forEach { document in
            batch.updateData(["isRead": true], forDocument: document.reference)
        }
        
        try? await batch.commit()
    }
}