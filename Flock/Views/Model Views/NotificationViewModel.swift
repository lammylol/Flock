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
    
    init(userID: String) {
        self.userID = userID
        setupNotificationListener()
        
        // Update unread count whenever notifications change
        $notifications
            .map { notifications in
                notifications.filter { !$notification.isRead }.count
            }
            .assign(to: &$unreadCount)
    }
    
    private func setupNotificationListener() {
        NotificationHelper.listenForNotifications(userID: userID) { [weak self] result in
            switch result {
            case .success(let notifications):
                self?.notifications = notifications.sorted(by: { $0.timestamp > $1.timestamp })
            case .failure(let error):
                print("Error fetching notifications: \(error.localizedDescription)")
            }
        }
    }
    
    func markAsRead(notificationID: String) async {
        await NotificationHelper.markNotificationAsRead(notificationID: notificationID)
    }
    
    func markAllAsRead() async {
        await NotificationHelper.markAllNotificationsAsRead(userID: userID)
    }
}