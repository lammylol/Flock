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
    private let db = Firestore.firestore()
    private let notificationsCollection = "notifications"
    
    func createNotification(for comment: Comment, postTitle: String, recipientID: String) async throws {
        guard !recipientID.isEmpty else { return }
        
        let notificationData: [String: Any] = [
            "postID": comment.postID,
            "postTitle": postTitle,
            "senderID": comment.userID,
            "senderName": "\(comment.firstName) \(comment.lastName)",
            "recipientID": recipientID,
            "type": "new_comment",
            "timestamp": FieldValue.serverTimestamp(),
            "isRead": false
        ]
        
        do {
            try await db.collection(notificationsCollection)
                .document(recipientID)
                .collection("userNotifications")
                .addDocument(data: notificationData)
        } catch {
            print("Error creating notification: \(error)")
            throw error
        }
    }
    
    func listenForNotifications(userID: String, completion: @escaping (Result<[Notification], NotificationError>) -> Void) {
        guard !userID.isEmpty else {
            completion(.failure(NotificationError.invalidData))
            return
        }
        
        db.collection(notificationsCollection)
            .document(userID)
            .collection("userNotifications")
            .order(by: "timestamp", descending: true)
            .addSnapshotListener { snapshot, error in
                if let error = error {
                    completion(.failure(NotificationError.firestoreError(error)))
                    return
                }
                
                guard let documents = snapshot?.documents else {
                    completion(.failure(NotificationError.invalidData))
                    return
                }
                
                let notifications = documents.compactMap { document -> Notification? in
                    var data = document.data()
                    if let timestamp = data["timestamp"] as? Timestamp {
                        data["timestamp"] = timestamp
                    } else {
                        data["timestamp"] = Timestamp(date: Date())
                    }
                    return Notification(id: document.documentID, data: data)
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
}
