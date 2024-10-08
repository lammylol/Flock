//
//  PostCard.swift
//  Flock
//
//  Created by Matt Lam on 10/5/24.
//

import SwiftUI

struct PostCard: View {
    @Environment(UserProfileHolder.self) var userHolder
    
    @State var post: Post
    
    var feedService = FeedService()
    
    var body: some View {
        ZStack {
            VStack {
                HStack {
                    ProfilePictureAvatar(firstName: post.firstName, lastName: post.lastName, imageSize: 24, fontSize: 12)
                    Text(post.firstName.capitalized)
                        .bold()
                        .font(.system(size: 16))
                    Spacer()
                }
                .padding(.bottom, 10)
                HStack{
                    Text(post.postTitle)
                        .font(.system(size: 16))
                        .multilineTextAlignment(.leading)
                        .bold()
                    Spacer()
                }
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
            .frame(width: 110, height: 150)
            .padding(15)
            
            if post.lastSeenNotificationCount > 0 {
                Text("\(post.lastSeenNotificationCount)")
                    .font(.system(size: 16))
                    .padding(10)
                    .background {
                        Circle()
                            .fill(.red)
                            .frame(width: 32, height: 32)
                    }
                    .foregroundStyle(.white)
                    .offset(x: 65, y: -90)
            }
        }
        .background {
            RoundedRectangle(cornerRadius: 10)
                .fill(Color.gray)
                .opacity(0.10)
        }
        .frame(maxWidth: .infinity)
        .frame(height: 200)
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
