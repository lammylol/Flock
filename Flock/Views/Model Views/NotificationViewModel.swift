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

@MainActor
class NotificationViewModel: ObservableObject {
    @Published var notifications: [Notification] = []
    @Published var unreadCount: Int = 0
    @Published private(set) var userID: String
    private let notificationHelper = NotificationHelper()
    
    init(userID: String? = nil) {
        // Use provided userID or get from Auth
        self.userID = userID ?? Auth.auth().currentUser?.uid ?? ""
        print("DEBUG: NotificationViewModel initialized with userID: \(self.userID)")
        print("DEBUG: Current Auth State - \(String(describing: Auth.auth().currentUser?.uid))")
        
        if !self.userID.isEmpty {
            setupNotificationListener()
        }
    }
    
    func updateUserID(_ newUserID: String) {
        print("DEBUG: Updating userID to: \(newUserID)")
        print("DEBUG: Current Auth State - \(String(describing: Auth.auth().currentUser?.uid))")
        
        guard !newUserID.isEmpty else {
            print("DEBUG: Attempted to update with empty userID")
            return
        }
        
        userID = newUserID
        notifications = []
        unreadCount = 0
        setupNotificationListener()
    }
    
    private func updateUnreadCount() {
        unreadCount = notifications.filter { !$0.isRead }.count
    }
    
    private func setupNotificationListener() {
        print("DEBUG: Setting up notification listener for userID: \(userID)")
        print("DEBUG: Auth state when setting up listener - \(String(describing: Auth.auth().currentUser?.uid))")
        
        notificationHelper.listenForNotifications(userID: userID) { [weak self] (result: Result<[Notification], NotificationError>) in
            guard let self = self else { return }
            
            switch result {
            case .success(let notifications):
                print("DEBUG: Successfully received \(notifications.count) notifications")
                Task { @MainActor in
                    self.notifications = notifications.sorted(by: { $0.timestamp > $1.timestamp })
                    self.updateUnreadCount()
                }
            case .failure(let error):
                print("DEBUG: Error fetching notifications: \(error)")
                print("DEBUG: UserID at time of error: \(self.userID)")
                print("DEBUG: Auth state at time of error - \(String(describing: Auth.auth().currentUser?.uid))")
            }
        }
    }
    
    func markAsRead(notificationID: String) async {
        print("DEBUG: Marking notification as read - ID: \(notificationID)")
        await notificationHelper.markNotificationAsRead(notificationID: notificationID, userID: userID)
    }
    
    func markAllAsRead() async {
        print("DEBUG: Marking all notifications as read for userID: \(userID)")
        await notificationHelper.markAllNotificationsAsRead(userID: userID)
    }
}