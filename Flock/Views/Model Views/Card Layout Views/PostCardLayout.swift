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
    @Environment(UISizing.self) var uiSize
    
    @State var viewModel: FeedViewModel
//
    var isExpanded: Bool = false

    var body: some View {
        if viewModel.posts.isEmpty && !viewModel.isLoading {
            noPostsView()
        } else {
            VStack {
                if !isExpanded {
                    horizontalScrollingPosts
                        .transition(.slide)
                } else if !viewModel.posts.isEmpty {
                    gridLayout()
                        .transition(.slide)
                }
            }
        }
    }

    // MARK: - Horizontal Scroll for Condensed Layout
    private var horizontalScrollingPosts: some View {
        ScrollView(.horizontal) {
            HStack(spacing: 8) {
                ForEach($viewModel.posts) { $post in
                    PostCard(post: $post, postCardSmallorLarge: false)
                    .task {
                        await fetchNextPostsIfNeeded(for: post)
                    }
                    .id(post.id)
                }
            }
            .padding(.trailing, 23) // Adjust padding for leading and trailing
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .scrollIndicators(.hidden)
        .padding(.trailing, -25)
    }

    // MARK: - Grid Layout for Expanded Layout
    private func gridLayout() -> some View {
        let gridColumnCount = calculateGridColumnCount(for: UIScreen.main.bounds.width)
        let gridRowCount = calculateGridRowCount(columnCount: gridColumnCount)

        return Grid {
            ForEach(0..<gridRowCount, id: \.self) { row in
                GridRow {
                    ForEach(0..<gridColumnCount, id: \.self) { col in
                        let index = col * gridRowCount + row
                        if index < $viewModel.posts.count {
                            PostCard(post: $viewModel.posts[index], postCardSmallorLarge: true)
                            .task {
                                await fetchNextPostsIfNeeded(for: viewModel.posts[index])
                            }
                            .id(viewModel.posts[index].id)
                        }
                    }
                }
            }
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .padding(.top, 8)
    }
    
    // MARK: - Empty Posts Overlay
    
    private func noPostsView() -> some View {
        HStack (alignment: .center) {
            Image(systemName: "pin")
            Text("No pinned posts to feature. Pin an existing post from your feed to add it to your today page.")
                .multilineTextAlignment(.leading)
                .font(.system(size: 14))
        }
        .foregroundStyle(Color.secondary)
        .padding(.horizontal, 5)
        .padding(.vertical, 10)
        .frame(maxHeight: .infinity)
    }

    // MARK: - Helper Functions
    @MainActor
    private func calculateGridColumnCount(for width: CGFloat) -> Int {
        Int(floor((width-100) / (UISizing.PostCard(smallVsLarge: true).width + 5))) // Adjust padding
    }

    @MainActor
    private func calculateGridRowCount(columnCount: Int) -> Int {
        Int(ceil(Double(viewModel.posts.count) / Double(columnCount)))
    }

    @MainActor
    private func fetchNextPostsIfNeeded(for post: Post) async {
        if viewModel.hasReachedEnd(of: post) && !viewModel.isFetching {
            await viewModel.getNextPosts(user: userHolder.person, person: userHolder.person)
        }
    }
}
//
//#Preview {
//    @Previewable @State var navigationPath = NavigationPath()
//    @Previewable @State var viewModel = FeedViewModel()
//
//    PostCardLayout(navigationPath: $navigationPath, viewModel: $viewModel, posts: [Post.preview, Post.preview, Post.preview, Post.preview], isExpanded: true)
//        .environment(UserProfileHolder())
//}
