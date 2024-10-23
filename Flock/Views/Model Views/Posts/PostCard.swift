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
    @State private var isPinned: Bool = true
    
    var isYourself: Bool {
        post.firstName == userHolder.person.firstName && post.lastName == userHolder.person.lastName
    }
    
    var feedService = FeedService()
    
    var body: some View {
        ZStack {
            VStack {
                HStack {
                    ProfilePictureAvatar(firstName: post.firstName, lastName: post.lastName, imageSize: 24, fontSize: 12)
                    Text(post.firstName.capitalized)
                        .bold()
                        .font(.system(size: 16))
                        .minimumScaleFactor(0.2)
                        .lineLimit(1)
                    Spacer()
                    if isPinned { Image(systemName: "pin.fill").font(.system(size: 12))}
                }
                .padding(.bottom, 10)
                HStack{
                    Text(post.postTitle)
                        .font(.system(size: 18))
                        .multilineTextAlignment(.leading)
                        .fontWeight(.regular)
                        .minimumScaleFactor(0.5)
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
            .frame(width: UISizing.PostCard().width, height: UISizing.PostCard().insideFrameHeight)
            .padding(15)
            
            if post.lastSeenNotificationCount > 0 {
                Text("\(post.lastSeenNotificationCount)")
                    .font(.system(size: 16))
                    .padding(10)
                    .background {
                        Circle()
                            .fill(.red)
                    }
                    .foregroundStyle(.white)
                    .offset(x: 62, y: -75)
            }
        }
        .background {
            RoundedRectangle(cornerRadius: 10)
                .fill(Color.gray)
                .opacity(0.10)
        }
        .frame(maxWidth: .infinity)
        .frame(height: UISizing.PostCard().outsideFrameHeight)
    }
    
    func updateLastSeenNotificationCount() {
        Task {
            do {
                try await feedService.updateLastSeenNotificationCount(post: post, person: userHolder.person)
                self.post.lastSeenNotificationCount = 0
            } catch {
                ViewLogger.error("PostCard.viewUpdate failed \(error)")
            }
        }
    }
}
//
//#Preview {
//    PostCard(post: Post.preview)
//        .environment(UserProfileHolder())
//}
