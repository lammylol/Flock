// Notification.swift
// Flock 
//
// Main notification sheet view
//
// Created by Ramon Jiang 10/26/24

import SwiftUI

struct NotificationSheet: View {
    @Environment(\.dismiss) var dismiss
    @ObservedObject var viewModel: NotificationViewModel
    @State private var selectedNotification: Notification?
    
    var body: some View {
        NavigationView {
            List {
                ForEach(groupedNotifications, id: \.key) { postID, notifications in
                    Section {
                        ForEach(notifications) { notification in
                            NotificationRow(notification: notification)
                                .contentShape(Rectangle())
                                .onTapGesture {
                                    selectedNotification = notification
                                }
                        }
                    } header: {
                        Text(notifications.first?.postTitle ?? "")
                    }
                }
            }
            .navigationTitle("Notifications")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("Close") {
                        dismiss()
                    }
                }
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Mark All Read") {
                        Task {
                            await viewModel.markAllAsRead()
                        }
                    }
                }
            }
        }
        .sheet(item: $selectedNotification) { notification in
            PostFullView(postID: notification.postID)
                .task {
                    if let id = notification.id {
                        await viewModel.markAsRead(notificationID: id)
                    }
                }
        }
    }
    
    private var groupedNotifications: [(key: String, value: [Notification])] {
        Dictionary(grouping: viewModel.notifications, by: { $0.postID })
            .sorted { $0.value.first?.timestamp ?? Date() > $1.value.first?.timestamp ?? Date() }
    }
}