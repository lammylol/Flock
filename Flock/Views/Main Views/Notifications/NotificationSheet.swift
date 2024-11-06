// Notification.swift
// Flock 
//
// Main notification sheet view
//
// Created by Ramon Jiang 10/26/24

import SwiftUI

struct NotificationSheet: View {
    @Environment(\.dismiss) var dismiss
    @Environment(\.colorScheme) var colorScheme
    @Environment(UserProfileHolder.self) var userHolder
    
    var viewModel: NotificationViewModel
    
    var body: some View {
        VStack {
            List {
                ForEach(groupedNotifications, id: \.key) { postID, notifications in
                    NotificationSection(
                        postID: postID,
                        notifications: notifications,
                        viewModel: viewModel,
                        userHolder: userHolder
                    )
                }
            }
            .scrollContentBackground(.hidden)
            .listStyle(.insetGrouped)
            .refreshable {
                viewModel.setupNotificationListener()
            }
            .task {
                viewModel.updateUserID(userHolder.person.userID)
            }
            .clipped()
            .toolbar {
                if viewModel.unreadCount > 0 {
                    ToolbarItem(placement: .navigationBarTrailing) {
                        Button("Mark All Read") {
                            Task {
                                await viewModel.markAllAsRead()
                            }
                        }
                        .foregroundColor(.blue)
                    }
                }
            }
            .overlay {
                if viewModel.notifications.isEmpty {
                    noNotificationsView()
                }
            }
        }
        .navigationTitle("Notifications")
        .navigationBarTitleDisplayMode(.inline)
        .background(colorScheme == .dark ? Color.black : Color(.systemGray6))
    }
    
    private var groupedNotifications: [(key: String, value: [Notification])] {
        Dictionary(grouping: viewModel.notifications, by: { $0.postID })
            .mapValues { notifications in
                notifications.sorted { $0.timestamp > $1.timestamp }.prefix(3)
            }
            .sorted { $0.value.first?.timestamp ?? Date() > $1.value.first?.timestamp ?? Date() }
            .map { (key: $0.key, value: Array($0.value)) }
    }
}

// Separate section view to break up complexity
struct NotificationSection: View {
    let postID: String
    let notifications: [Notification]
    let viewModel: NotificationViewModel
    let userHolder: UserProfileHolder
    
    var body: some View {
        Section {
            ForEach(notifications) { notification in
                NotificationRow(notification: notification)
                    .listRowInsets(EdgeInsets())
                    .contentShape(Rectangle())
                    .onTapGesture {
                        Task {
                            await viewModel.markPostNotificationsAsRead(postID: postID)
                        }
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

// MARK: - Empty Notifications Overlay

private func noNotificationsView() -> some View {
    VStack(alignment: .center){
        ContentUnavailableView {
            Label("No Notifications", systemImage: "tray")
        } description: {
            Text("You'll be notified when there's new activity!")
        }
        .frame(height: 200)
        .offset(y: 140)
        Spacer()
    }
}
