//
//  HorizontalScrollingPostCards.swift
//  Flock
//
//  Created by Matt Lam on 10/5/24.
//

import SwiftUI

struct HorizontalScrollingPostCards: View {
    var posts: [Post]
    
    var body: some View {
        ScrollView (.horizontal) {
            HStack(spacing: 10) {
                ForEach(posts) { post in
                    PostCard(post: post)
                }
            }
        }
        .scrollIndicators(.hidden)
    }
}

#Preview {
    HorizontalScrollingPostCards(posts: [Post.preview, Post.preview, Post.preview, Post.preview])
        .environment(UserProfileHolder())
}
