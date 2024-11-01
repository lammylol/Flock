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
    @Environment(UserProfileHolder.self) var userHolder
    @Binding var navigationPath: NavigationPath
    
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
                                    navigationPath.append(notification)
                                }
                        }
                    } header: {
                        Text(notifications.first?.postTitle ?? "")
                            .font(.system(size: 14))
                            .fontWeight(.medium)
                    }
                }
            }
            .onAppear {
                // Update without optional binding since userID is non-optional
                viewModel.updateUserID(userHolder.person.userID)
            }
            .listStyle(.insetGrouped)
        }
        .navigationTitle("Notifications")
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
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
                post: .constant(post)
            )
            .task {
                await viewModel.markAsRead(notificationID: notification.id)
            }
        }
    }
    
    private var groupedNotifications: [(key: String, value: [Notification])] {
        Dictionary(grouping: viewModel.notifications, by: { $0.postID })
            .sorted { $0.value.first?.timestamp ?? Date() > $1.value.first?.timestamp ?? Date() }
    }
}
