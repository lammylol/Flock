// Notification.swift
// Flock 
//
// Main notification sheet view
//
// Created by Ramon Jiang 10/26/24

import SwiftUI

struct NotificationSheet: View {
    @Environment(\.dismiss) var dismiss
    var viewModel: NotificationViewModel
    @State private var selectedNotification: Notification?
    @Environment(UserProfileHolder.self) var userHolder
    
    var body: some View {
        NavigationView {
            List {
                ForEach(groupedNotifications, id: \.key) { postID, notifications in
                    Section {
                        ForEach(notifications) { notification in
                            NotificationRow(notification: notification)
                                .listRowInsets(EdgeInsets())
                                .contentShape(Rectangle())
                                .onTapGesture {
                                    selectedNotification = notification
                                }
                        }
                    } header: {
                        HStack {
                            Text(notifications.first?.postTitle ?? "")
                                .font(.system(size: 14))
                                .fontWeight(.medium)
                            Spacer()
                            Button {
                                Task {
                                    await viewModel.clearPostNotifications(postID: postID)
                                }
                            } label: {
                                Image(systemName: "xmark")
                                    .foregroundColor(.gray)
                                    .font(.system(size: 12))
                            }
                        }
                    }
                }
            }
            .listStyle(.insetGrouped)
            .task {
                viewModel.updateUserID(userHolder.person.userID)
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
                    .foregroundColor(.blue)
                }
            }
            .sheet(item: $selectedNotification) { notification in
                NavigationView {
                    let post = Post(
                        id: notification.postID,
                        date: notification.timestamp,
                        userID: notification.senderID,
                        username: "",
                        firstName: notification.senderName.components(separatedBy: " ").first ?? "",
                        lastName: notification.senderName.components(separatedBy: " ").last ?? "",
                        postTitle: notification.postTitle,
                        postText: "",
                        postType: "Note",
                        status: "Current",
                        privacy: "public",
                        isPinned: false,
                        lastSeenNotificationCount: 0
                    )
                    PostFullView(
                        person: Person(
                            userID: notification.senderID,
                            username: "",
                            firstName: notification.senderName.components(separatedBy: " ").first ?? "",
                            lastName: notification.senderName.components(separatedBy: " ").last ?? ""
                        ),
                        post: .constant(post),
                        isFromNotificationSheet: true  // Add this parameter
                    )
                    .task {
                        await viewModel.markAsRead(notificationID: notification.id)
                    }
                    .toolbar {
                        ToolbarItem(placement: .navigationBarLeading) {
                            Button("Back") {
                                selectedNotification = nil
                            }
                        }
                    }
                }
            }
        }
    }
    
    private var groupedNotifications: [(key: String, value: [Notification])] {
        Dictionary(grouping: viewModel.notifications, by: { $0.postID })
            .mapValues { notifications in
                // Sort notifications by timestamp (most recent first) and take the first 3
                notifications.sorted { $0.timestamp > $1.timestamp }.prefix(3)
            }
            .sorted { $0.value.first?.timestamp ?? Date() > $1.value.first?.timestamp ?? Date() }
            .map { (key: $0.key, value: Array($0.value)) }
    }
}
