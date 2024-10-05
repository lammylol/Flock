//
//  PostCard.swift
//  Flock
//
//  Created by Matt Lam on 10/5/24.
//

import SwiftUI

struct PostCard: View {
//    @State var person: Person = Person()
    var post: Post
    
    var body: some View {
        VStack {
            VStack (alignment: .trailing) {
                Text(post.lastSeenNotificationCount)
            }
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
            Button {
                viewUpdate()
            } label: {
                tagModelView(textLabel: "View Update", textSize: 12, foregroundColor: .white, backgroundColor: .red)
            }
        }
        .frame(width: 117, height: 190)
        .padding(.all, 10)
    }
    
    func viewUpdate() {
        
    }
}

#Preview {
    PostCard(post: Post.preview)
}
