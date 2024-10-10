//
//  HorizontalScrollingPostCards.swift
//  Flock
//
//  Created by Matt Lam on 10/5/24.
//

import SwiftUI
import UIKit

struct PostCardLayout: View {
    @Environment(UserProfileHolder.self) var userHolder
    
    // Pass in the NavigationPath from parent
    @Binding var navigationPath: NavigationPath
    @Binding var viewModel: PinnedFeedViewModel
    
    var posts: [Post]
    var isExpanded: Bool = false
    
    var body: some View {
        if !isExpanded {
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
                        .task {
                            if viewModel.hasReachedEnd(of: post) && !viewModel.isFetching {
                                await viewModel.getNextPosts(user: userHolder.person, person: userHolder.person, profileOrFeed: "profile")
                            }
                        }
                    }
                }
                .padding(.trailing, 23)
            }
            .scrollIndicators(.hidden)
        } else {
            LazyVStack(spacing: 10.0) {
                ForEach(posts) { post in
                    Rectangle()
                        .fill(.purple)
                        .aspectRatio(3.0 / 2.0, contentMode: .fit)
                        .containerRelativeFrame(
                            .horizontal, count: 4, span: 3, spacing: 10.0)
                }
            }
        }
    }
}
//
//#Preview {
//    PostCardLayout(posts: [Post.preview, Post.preview, Post.preview, Post.preview])
//        .environment(UserProfileHolder())
//}
