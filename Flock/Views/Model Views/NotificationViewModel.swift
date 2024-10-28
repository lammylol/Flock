// Notification.swift
// Flock 
//
// Handles real-time updates to Notifications
//
// Created by Ramon Jiang 10/26/24

import Foundation
import FirebaseFirestore
import SwiftUI

@MainActor
class NotificationViewModel: ObservableObject {
    @Published var notifications: [Notification] = []
    @Published var unreadCount: Int = 0
    @Published private(set) var userID: String
    private let notificationHelper = NotificationHelper()
    
    init(userID: String) {
        self.userID = userID
        setupNotificationListener()
    }
    
    func updateUserID(_ newUserID: String) {
        // Only update and refresh if userID is not empty
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
                print("Error fetching notifications: \(error)")
            }
        }
    }
    
    func markAsRead(notificationID: String) async {
        await notificationHelper.markNotificationAsRead(notificationID: notificationID, userID: userID)
    }
    
    func markAllAsRead() async {
        await notificationHelper.markAllNotificationsAsRead(userID: userID)
    }
}