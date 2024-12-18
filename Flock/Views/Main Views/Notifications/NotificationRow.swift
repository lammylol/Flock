// NotificationRow.swift
// Flock 
//
// View for individual notification
//
// Created by Ramon Jiang 10/26/24

import SwiftUI

struct NotificationRow: View {    
    let notification: Notification
    var post: Post = Post()
    var person: Person = Person()
    
    init(notification: Notification) {
        self.notification = notification
    }
    
    var body: some View {
        HStack(spacing: 12) {
            ProfilePictureAvatar(
                firstName: notification.senderName.components(separatedBy: " ").first ?? "",
                lastName: notification.senderName.components(separatedBy: " ").last ?? "",
                imageSize: 35,
                fontSize: 16
            )
            
            VStack(alignment: .leading, spacing: 4) {
                HStack(spacing: 5) {
                    Text(notification.senderName)
                        .fontWeight(.medium)
                        .font(.system(size: 14))
                    
                    Text(PostHelper().relativeTimeStringAbbrev(for: notification.timestamp))
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
                
                Text("commented on '\(notification.postTitle)'")
                    .font(.system(size: 14))
                    .foregroundColor(.secondary)
                    .lineLimit(1)
            }
            
            Spacer()
            
            Circle()
                .fill(notification.isRead ? Color.clear : Color.blue)
                .frame(width: 8, height: 8)
        }
        .padding(.vertical, 8)
        .padding(.horizontal, 12)
        .contentShape(Rectangle())
    }
}
