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
    @Binding var navigationPath: NavigationPath  // Added this line
    @State private var selectedNotification: Notification?
    @Environment(UserProfileHolder.self) var userHolder
    private let postOperationsService = PostOperationsService()
    
    var body: some View {
        NavigationView {
            List {
                ForEach(groupedNotifications, id: \.key) { postID, notifications in
                    NotificationSection(
                        postID: postID,
                        notifications: notifications,
                        viewModel: viewModel,
                        selectedNotification: $selectedNotification,
                        userHolder: userHolder
                    )
                }
            }
            .listStyle(.insetGrouped)
            .refreshable {
                viewModel.setupNotificationListener()
            }
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
                    let person = Person(
                        userID: notification.senderID,
                        username: "",
                        firstName: notification.senderName.components(separatedBy: " ").first ?? "",
                        lastName: notification.senderName.components(separatedBy: " ").last ?? ""
                    )
                    
                    let post = Post(
                        id: notification.postID,
                        date: notification.timestamp,
                        userID: notification.senderID,
                        username: "",
                        firstName: person.firstName,
                        lastName: person.lastName,
                        postTitle: notification.postTitle,
                        postText: "",
                        postType: "Note",
                        status: "Current",
                        latestUpdateText: "",
                        latestUpdateDatePosted: notification.timestamp,
                        latestUpdateType: "",
                        privacy: "public",
                        isPinned: false,
                        lastSeenNotificationCount: 0
                    )
                    
                    PostFullView(
                        person: person,
                        post: .constant(post),
                        isFromNotificationSheet: true
                    )
                    .toolbar {
                        ToolbarItem(placement: .navigationBarLeading) {
                            Button("Back") {
                                selectedNotification = nil
                                Task {
                                    await viewModel.clearPostNotifications(postID: notification.postID)
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    // Fixed function to check and cleanup notifications from deleted users
    private func checkAndCleanupDeletedUserNotifications(_ notification: Notification) async {
        do {
            let dummyPost = Post(
                id: notification.postID,
                userID: notification.senderID
            )
            
            do {
                _ = try await postOperationsService.getPost(
                    prayerRequest: dummyPost,
                    user: userHolder.person
                )
            } catch {
                // If we can't fetch the post, assume the user is deleted
                print("DEBUG: Post/User not found, cleaning up notifications")
                await viewModel.clearPostNotifications(postID: notification.postID)
            }
        } catch {
            print("DEBUG: Error checking post existence: \(error)")
        }
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
    @Binding var selectedNotification: Notification?
    let userHolder: UserProfileHolder
    
    var body: some View {
        Section {
            ForEach(notifications) { notification in
                NotificationRow(notification: notification)
                    .listRowInsets(EdgeInsets())
                    .contentShape(Rectangle())
                    .onTapGesture {
                        selectedNotification = notification
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
