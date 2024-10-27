// NotificationRow.swift
// Flock 
//
// View for individual notification
//
// Created by Ramon Jiang 10/26/24

import SwiftUI

struct NotificationRow: View {
    let notification: Notification
    
    var body: some View {
        HStack {
            Circle()
                .fill(notification.isRead ? Color.gray.opacity(0.3) : Color.blue)
                .frame(width: 8, height: 8)
            
            VStack(alignment: .leading, spacing: 4) {
                Text("\(notification.senderName) commented on this post")
                    .font(.subheadline)
                    .foregroundColor(.primary)
                
                Text(notification.timestamp, style: .relative)
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
            
            Spacer()
        }
        .padding(.vertical, 4)
    }
}