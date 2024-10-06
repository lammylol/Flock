//
//  PostCard.swift
//  Flock
//
//  Created by Matt Lam on 10/5/24.
//

import SwiftUI

struct PostCard: View {
    @Environment(UserProfileHolder.self) var userHolder
    var post: Post
    var feedService = FeedService()
    
    var body: some View {
        ZStack {
            VStack {
                HStack {
                    ProfilePictureAvatar(firstName: post.firstName, lastName: post.lastName, imageSize: 18, fontSize: 8)
                    Text(post.firstName.capitalized)
                        .bold()
                        .font(.system(size: 14))
                    Spacer()
                }
                .padding(.bottom, 10)
                Text(post.postTitle)
                    .font(.system(size: 12))
                Spacer()
                if post.lastSeenNotificationCount > 0 {
                    NavigationLink(destination: UpdateView(post: post, person: Person(userID: post.userID, username: post.username, firstName: post.firstName, lastName: post.lastName))
                        .onAppear {
                            updateLastSeenNotificationCount()
                        })
                    {
                        tagModelView(textLabel: "View Update", textSize: 12, foregroundColor: .white, backgroundColor: .red)
                    }
                }
            }
            .frame(width: 117, height: 160)
            .padding(.horizontal, 15)
            .padding(.vertical, 15)
            
            HStack {
                Text("\(post.lastSeenNotificationCount)")
                    .font(.system(size: 16))
                    .padding(.all, 10)
                    .background {
                        Circle()
                            .fill(.red)
                            .frame(width: 32, height: 32)
                    }
                    .foregroundStyle(.white)
            }
            .offset(x: 65, y: -90)
            
        }
        .background {
            RoundedRectangle(cornerRadius: 10)
                .fill(Color.gray)
                .opacity(0.10)
        }
        .padding(.top, 20)
    }
    
    func updateLastSeenNotificationCount() {
        Task {
            do {
                try await feedService.updateLastSeenNotificationCount(post: post, person: userHolder.person)
            } catch {
                ViewLogger.error("PostCard.viewUpdate failed \(error)")
            }
        }
    }
}

#Preview {
    PostCard(post: Post.preview)
        .environment(UserProfileHolder())
}
