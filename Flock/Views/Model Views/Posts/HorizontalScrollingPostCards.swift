//
//  HorizontalScrollingPostCards.swift
//  Flock
//
//  Created by Matt Lam on 10/5/24.
//

import SwiftUI

struct HorizontalScrollingPostCards: View {
    // Pass in the NavigationPath from parent
   @Binding var navigationPath: NavigationPath
    
    var posts: [Post]
    
    var body: some View {
        ScrollView (.horizontal) {
            HStack(spacing: 10) {
                ForEach(posts) { post in
                    Button {
                        // Navigate to post detail
                        navigationPath.append(post)
                    } label: {
                        PostCard(post: post)
                    }
                    .foregroundStyle(Color.primary)
                }
            }
            .padding(.trailing, 23)
        }
        .scrollIndicators(.hidden)
    }
}

//#Preview {
//    HorizontalScrollingPostCards(posts: [Post.preview, Post.preview, Post.preview, Post.preview])
//        .environment(UserProfileHolder())
//}
