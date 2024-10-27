// Notification.swift
// Flock 
//
// Handles real-time updates to Notifications
//
// Created by Ramon Jiang 10/26/24

import Foundation
import FirebaseFirestore
import Combine

@MainActor
class NotificationViewModel: ObservableObject {
    @Published var notifications: [Notification] = []
    @Published var unreadCount: Int = 0
    private var cancellables = Set<AnyCancellable>()
    private let userID: String
    private let notificationHelper = NotificationHelper() // Create an instance
    
    init(userID: String) {
        self.userID = userID
        setupNotificationListener()
        
        // Fix the $notification syntax error
        $notifications
            .map { notifications in
                notifications.filter { !$0.isRead }.count // Changed $notification to $0
            }
            .assign(to: &$unreadCount)
    }
    
    private func setupNotificationListener() {
        // Use the instance method
        notificationHelper.listenForNotifications(userID: userID) { [weak self] result in
            switch result {
            case .success(let notifications):
                self?.notifications = notifications.sorted(by: { $0.timestamp > $1.timestamp })
            case .failure(let error):
                print("Error fetching notifications: \(error.localizedDescription)")
            }
        }
    }
    
    func markAsRead(notificationID: String) async {
        // Use the instance method
        await notificationHelper.markNotificationAsRead(notificationID: notificationID)
    }
    
    func markAllAsRead() async {
        // Use the instance method
        await notificationHelper.markAllNotificationsAsRead(userID: userID)
    }
}