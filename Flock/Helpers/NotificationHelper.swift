// Notification.swift
// Flock 
//
// Handles Firestore operations for notifications
//
// Created by Ramon Jiang 10/26/24

import Foundation
import FirebaseFirestore
import FirebaseAuth
import OSLog

enum NotificationError: Error {
    case firestoreError(Error)
    case noData
    case decodingError
}

class NotificationHelper {
    private let db = Firestore.firestore()
    private let notificationsCollection = "notifications"
    
    func createNotification(for comment: Comment, postTitle: String, recipientID: String) async throws {
        ModelLogger.debug("NotificationHelper.createNotification: Creating notification for recipient: \(recipientID)")
        ModelLogger.debug("NotificationHelper.createNotification: Comment UserID: \(comment.userID)")
        
        guard !recipientID.isEmpty else {
            ModelLogger.error("NotificationHelper.createNotification: Empty recipientID provided")
            return
        }
        
        // Check if recipient still exists
        do {
            let userRef = db.collection("users").document(recipientID)
            let userDoc = try await userRef.getDocument()
            
            guard userDoc.exists else {
                ModelLogger.notice("NotificationHelper.createNotification: Recipient user no longer exists, skipping notification")
                return
            }
            
            let notificationData: [String: Any] = [
                "postID": comment.postID,
                "postTitle": postTitle,
                "senderID": comment.userID,
                "senderName": "\(comment.firstName) \(comment.lastName)",
                "senderUsername": comment.username,
                "recipientID": recipientID,
                "type": "new_comment",
                "timestamp": FieldValue.serverTimestamp(),
                "isRead": false
            ]
            
            try await db.collection(notificationsCollection)
                .document(recipientID)
                .collection("userNotifications")
                .addDocument(data: notificationData)
            ModelLogger.info("NotificationHelper.createNotification: Successfully created notification for recipient: \(recipientID)")
        } catch {
            ModelLogger.error("NotificationHelper.createNotification failed: \(error.localizedDescription)")
            throw error
        }
    }
    
    func markNotificationAsRead(notificationID: String, userID: String) async {
        guard !notificationID.isEmpty, !userID.isEmpty else { return }
        
        do {
            try await db.collection(notificationsCollection)
                .document(userID)
                .collection("userNotifications")
                .document(notificationID)
                .updateData(["isRead": true])
        } catch {
            ModelLogger.error("NotificationHelper.markNotificationAsRead failed: \(error.localizedDescription)")
        }
    }
    
    func markAllNotificationsAsRead(userID: String) async {
        guard !userID.isEmpty else { return }
        
        do {
            let snapshot = try await db.collection(notificationsCollection)
                .document(userID)
                .collection("userNotifications")
                .whereField("isRead", isEqualTo: false)
                .getDocuments()
            
            let batch = db.batch()
            snapshot.documents.forEach { document in
                batch.updateData(["isRead": true], forDocument: document.reference)
            }
            
            try await batch.commit()
            ModelLogger.info("NotificationHelper.markAllNotificationsAsRead: Successfully marked all notifications as read for user: \(userID)")
        } catch {
            ModelLogger.error("NotificationHelper.markAllNotificationsAsRead failed: \(error.localizedDescription)")
        }
    }
    
    func deleteNotifications(userID: String, forPostID postID: String) async {
        guard !userID.isEmpty, !postID.isEmpty else { return }
        
        do {
            let snapshot = try await db.collection(notificationsCollection)
                .document(userID)
                .collection("userNotifications")
                .whereField("postID", isEqualTo: postID)
                .getDocuments()
            
            if !snapshot.documents.isEmpty {
                let batch = db.batch()
                snapshot.documents.forEach { document in
                    let ref = db.collection(notificationsCollection)
                        .document(userID)
                        .collection("userNotifications")
                        .document(document.documentID)
                    batch.deleteDocument(ref)
                }
                
                try await batch.commit()
                ModelLogger.info("NotificationHelper.deleteNotifications: Successfully deleted notifications for post: \(postID)")
            }
        } catch {
            ModelLogger.error("NotificationHelper.deleteNotifications failed: \(error.localizedDescription)")
        }
    }

    func deleteAllNotifications(userID: String) async throws {
        guard !userID.isEmpty else { return }
        
        do {
            let recipientRef = db.collection(notificationsCollection)
                .document(userID)
            
            let userNotifications = try await recipientRef.collection("userNotifications").getDocuments()
            let batch = db.batch()
            
            for document in userNotifications.documents {
                batch.deleteDocument(document.reference)
            }
            
            batch.deleteDocument(recipientRef)
            
            try await batch.commit()
            
            let allNotificationsQuery = db.collection(notificationsCollection)
            let allNotificationDocs = try await allNotificationsQuery.getDocuments()
            
            for userDoc in allNotificationDocs.documents {
                let userNotificationsRef = userDoc.reference.collection("userNotifications")
                let senderNotifications = try await userNotificationsRef
                    .whereField("senderID", isEqualTo: userID)
                    .getDocuments()
                
                if !senderNotifications.documents.isEmpty {
                    let batch = db.batch()
                    for notification in senderNotifications.documents {
                        batch.deleteDocument(notification.reference)
                    }
                    try await batch.commit()
                }
            }
            
            ModelLogger.info("NotificationHelper.deleteAllNotifications: Successfully deleted all notifications for user: \(userID)")
        } catch {
            ModelLogger.error("NotificationHelper.deleteAllNotifications failed: \(error.localizedDescription)")
            throw error
        }
    }

    @discardableResult
    func listenForNotifications(userID: String, completion: @escaping (Result<[Notification], NotificationError>) -> Void) -> ListenerRegistration {
        ModelLogger.debug("NotificationHelper.listenForNotifications: Starting listener for user: \(userID)")
        
        let notificationsRef = db.collection(notificationsCollection)
            .document(userID)
            .collection("userNotifications")
        
        return notificationsRef.addSnapshotListener { querySnapshot, error in
            if let error = error {
                ModelLogger.error("NotificationHelper.listenForNotifications failed: \(error.localizedDescription)")
                completion(.failure(.firestoreError(error)))
                return
            }
            
            guard let documents = querySnapshot?.documents else {
                ModelLogger.error("NotificationHelper.listenForNotifications: No documents found")
                completion(.failure(.noData))
                return
            }
            
            let notifications = documents.compactMap { document -> Notification? in
                Notification(id: document.documentID, data: document.data())
            }
            
            if !notifications.isEmpty {
                ModelLogger.info("NotificationHelper.listenForNotifications: Retrieved \(notifications.count) notifications for user: \(userID)")
            } else {
                ModelLogger.debug("NotificationHelper.listenForNotifications: No notifications found for user: \(userID)")
            }
            
            completion(.success(notifications))
        }
    }
}