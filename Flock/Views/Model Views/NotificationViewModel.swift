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
    
    init(userID: String? = nil) {
        self.userID = userID ?? Auth.auth().currentUser?.uid ?? ""
        
        if !self.userID.isEmpty {
            setupNotificationListener()
        }
    }
    
    func updateUserID(_ newUserID: String) {
        guard !newUserID.isEmpty else { return }
        
        userID = newUserID
        notifications = []
        unreadCount = 0
        setupNotificationListener()
    }
    
    private func updateUnreadCount() {
        unreadCount = notifications.filter { !$0.isRead }.count
    }
    
    private func setupNotificationListener() {
        notificationHelper.listenForNotifications(userID: userID) { [weak self] (result: Result<[Notification], NotificationError>) in
            guard let self = self else { return }
            
            switch result {
            case .success(let notifications):
                Task { @MainActor in
                    self.notifications = notifications.sorted(by: { $0.timestamp > $1.timestamp })
                    self.updateUnreadCount()
                }
            case .failure(let error):
                print("DEBUG: Error fetching notifications: \(error)")
            }
        }
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

    // Add new function to mark all notifications for a post as read
    func markPostNotificationsAsRead(postID: String) async {
        // Get all notifications for this post
        let postNotifications = notifications.filter { $0.postID == postID }
        
        // Mark each unread notification as read
        for notification in postNotifications where !notification.isRead {
            await notificationHelper.markNotificationAsRead(notificationID: notification.id, userID: userID)
        }
    }
}
