//
//  PostCard.swift
//  Flock
//
//  Created by Matt Lam on 10/5/24.
//

import SwiftUI

struct PostCard: View {
    @Environment(UserProfileHolder.self) var userHolder
    @Environment(NavigationManager.self) var navigationManager
    
    @Binding var post: Post
    
    @State private var isPinned: Bool = true
    
    var postCardSmallorLarge: Bool? = false // false is default which is large.
    
    var postCardSize: UISizing.PostCard {
        .init(smallVsLarge: postCardSmallorLarge ?? false)
    }
    
    var isYourself: Bool {
        post.firstName == userHolder.person.firstName && post.lastName == userHolder.person.lastName
    }
    
    var feedService = FeedService()
    
    var body: some View {
        ZStack(alignment: .topTrailing) {
            Button {
                navigationManager.navigateTo(NavigationItem.post(post))
            } label: {
                VStack {
                    HStack {
                        ProfilePictureAvatar(firstName: post.firstName, lastName: post.lastName, imageSize: 24, fontSize: 12)
                        Text(post.firstName.capitalized)
                            .bold()
                            .font(.system(size: 16))
                            .minimumScaleFactor(0.2)
                            .lineLimit(1)
                        Spacer()
                        if isPinned, (postCardSmallorLarge ?? false == false) { Image(systemName: "pin.fill").font(.system(size: 12))} // if the postCard is small / expanded, remove the pin to make priority space for name.
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
    //                if post.lastSeenNotificationCount > 0 {
    //                    NavigationLink(destination: UpdateView(post: post, person: Person(userID: post.userID, username: post.username, firstName: post.firstName, lastName: post.lastName))
    //                        .onAppear {
    //                            updateLastSeenNotificationCount()
    //                        })
    //                    {
    //                        tagModelView(textLabel: "View", textSize: 12, foregroundColor: .white, backgroundColor: .blue)
    //                    }
    //                }
            }
            }
            .foregroundStyle(Color.primary)
            .frame(width: postCardSize.width, height: postCardSize.insideFrameHeight)
            .padding(15)
            
            // commented out for now until notifications can be tested.
//            if post.lastSeenNotificationCount > 0 {
//                Text("\(post.lastSeenNotificationCount)")
//                    .font(.system(size: 16))
//                    .padding(10)
//                    .background {
//                        Circle()
//                            .fill(.blue)
//                    }
//                    .foregroundStyle(.white)
////                    .offset(x: 62, y: -75)
//                    .padding(.trailing, -10)
//                    .padding(.top, -18)
//            }
        }
        .background {
            RoundedRectangle(cornerRadius: 10)
                .fill(Color.gray)
                .opacity(0.10)
        }
        .frame(maxWidth: .infinity)
        .frame(height: postCardSize.outsideFrameHeight)
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
