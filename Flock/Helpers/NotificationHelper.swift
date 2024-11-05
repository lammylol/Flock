// Notification.swift
// Flock 
//
// Handles Firestore operations for notifications
//
// Created by Ramon Jiang 10/26/24

import Foundation
import FirebaseFirestore
import FirebaseAuth

enum NotificationError: Error {
    case firestoreError(Error)
    case noData
    case decodingError
}

class NotificationHelper {
    private let db = Firestore.firestore()
    private let notificationsCollection = "notifications"
    
    func createNotification(for comment: Comment, postTitle: String, recipientID: String) async throws {
        print("DEBUG: Creating notification")
        print("DEBUG: RecipientID: \(recipientID)")
        print("DEBUG: Comment UserID: \(comment.userID)")
        
        guard !recipientID.isEmpty else {
            print("DEBUG: Empty recipientID provided")
            return
        }
        
        // Check if recipient still exists
        do {
            let userRef = db.collection("users").document(recipientID)
            let userDoc = try await userRef.getDocument()
            
            guard userDoc.exists else {
                print("DEBUG: Recipient user no longer exists, skipping notification")
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
            print("DEBUG: Successfully created notification")
        } catch {
            print("DEBUG: Error creating notification: \(error)")
            throw error
        }
    }
    
    @discardableResult
    func listenForNotifications(userID: String, completion: @escaping (Result<[Notification], NotificationError>) -> Void) -> ListenerRegistration {
        let notificationsRef = db.collection(notificationsCollection)
            .document(userID)
            .collection("userNotifications")
        
        return notificationsRef.addSnapshotListener { querySnapshot, error in
            if let error = error {
                completion(.failure(.firestoreError(error)))
                return
            }
            
            guard let documents = querySnapshot?.documents else {
                completion(.failure(.noData))
                return
            }
            
            let notifications = documents.compactMap { document -> Notification? in
                Notification(id: document.documentID, data: document.data())
            }
            
            completion(.success(notifications))
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
            print("Error marking notification as read: \(error)")
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
        } catch {
            print("Error marking all notifications as read: \(error)")
        }
    }
    
    func deleteNotifications(userID: String, forPostID postID: String) async {
        guard !userID.isEmpty, !postID.isEmpty else { return }
        
        do {
            // Get all notifications for this post
            let snapshot = try await db.collection(notificationsCollection)
                .document(userID)
                .collection("userNotifications")
                .whereField("postID", isEqualTo: postID)
                .getDocuments()
            
            // If there are notifications to delete, batch delete them
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
                print("DEBUG: Successfully deleted notifications for post: \(postID)")
            }
        } catch {
            print("DEBUG: Error deleting notifications: \(error)")
        }
    }

    // Add this new function to delete all notifications for a user
    func deleteAllNotifications(userID: String) async throws {
        guard !userID.isEmpty else { return }
        
        do {
            // Delete notifications where user is recipient
            let recipientRef = db.collection(notificationsCollection)
                .document(userID)
            
            // Delete the entire userNotifications subcollection
            let userNotifications = try await recipientRef.collection("userNotifications").getDocuments()
            let batch = db.batch()
            
            for document in userNotifications.documents {
                batch.deleteDocument(document.reference)
            }
            
            // Delete the user's notifications document itself
            batch.deleteDocument(recipientRef)
            
            try await batch.commit()
            
            // Delete notifications where user is sender
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
            
            print("DEBUG: Successfully deleted all notifications for user: \(userID)")
        } catch {
            print("DEBUG: Error deleting notifications: \(error)")
            throw error
        }
    }
}
