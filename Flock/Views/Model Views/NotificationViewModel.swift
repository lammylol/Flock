// Notification.swift
// Flock 
//
// Handles real-time updates to Notifications
//
// Created by Ramon Jiang 10/26/24

import Foundation
import FirebaseFirestore
import SwiftUI

import Foundation
import FirebaseFirestore
import FirebaseAuth
import SwiftUI

@Observable
class NotificationViewModel {
    var notifications: [Notification] = []
    var unreadCount: Int = 0
    private(set) var userID: String
    private let notificationHelper = NotificationHelper()
    private var listener: ListenerRegistration?  // Add this property
    
    init(userID: String? = nil) {
        self.userID = userID ?? Auth.auth().currentUser?.uid ?? ""
        
        if !self.userID.isEmpty {
            setupNotificationListener()
        }
    }
    
    func updateUserID(_ newUserID: String) {
        guard !newUserID.isEmpty else { return }
        
        listener?.remove()  // Remove existing listener before setting up new one
        userID = newUserID
        notifications = []
        unreadCount = 0
        setupNotificationListener()
    }
    
    private func updateUnreadCount() {
        unreadCount = notifications.filter { !$0.isRead }.count
    }
    
    // Change to public and update listener management
    func setupNotificationListener() {
        // Remove existing listener if there is one
        listener?.remove()
        
        // Store the returned ListenerRegistration
        listener = notificationHelper.listenForNotifications(userID: userID) { [weak self] result in
            guard let self = self else { return }
            
            switch result {
            case .success(let notifications):
                Task { @MainActor in
                    self.notifications = notifications.sorted(by: { $0.timestamp > $1.timestamp })
                    self.updateUnreadCount()
                    NetworkingLogger.info("NotificationListener turned on.")
                }
            case .failure(let error):
                print("DEBUG: Error fetching notifications: \(error)")
            }
        }
    }
    
    deinit {
        listener?.remove()  // Clean up listener when ViewModel is deallocated
        NetworkingLogger.info("NotificationListener turned off.")
    }
    
    func markAsRead(notificationID: String) async {
        await notificationHelper.markNotificationAsRead(notificationID: notificationID, userID: userID)
    }

    func markAllAsRead() async {
        await notificationHelper.markAllNotificationsAsRead(userID: userID)
    }
    
    func clearPostNotifications(postID: String) async {
        // Delete from Firestore first
        await notificationHelper.deleteNotifications(userID: userID, forPostID: postID)
        
        // Then update local state
        await MainActor.run {
            notifications.removeAll(where: { $0.postID == postID })
            updateUnreadCount()
        }
    }

    func markPostNotificationsAsRead(postID: String) async {
        // Get all notifications for this post
        let postNotifications = notifications.filter { $0.postID == postID }
        
        // Mark each unread notification as read
        for notification in postNotifications where !notification.isRead {
            await notificationHelper.markNotificationAsRead(notificationID: notification.id, userID: userID)
        }
    }
}
