//
//  PrayerFeedRowView.swift
//  Prayer Calendar
//
//  Created by Matt Lam on 4/28/24.
//

import SwiftUI

struct PostsFeed: View {
    @State var viewModel: FeedViewModel
    @Environment(UserProfileHolder.self) var userHolder
    @Environment(\.colorScheme) var colorScheme
    @State var person: Person
    @State var profileOrFeed: String = "feed"
    @State private var showSubmit: Bool = false
    
    var body: some View {
        LazyVStack {
            ForEach($viewModel.posts) { $post in
                VStack {
                    NavigationLink(destination: PostFullView(post: $post)) {
                        PostRow(viewModel: viewModel, post: $post)
                    }
                    Divider()
                }
                .task {
                    loadMorePostsIfNeeded(currentPost: post)
                }
            }
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .top)
        .overlay {
            if person.friendStateRequiresOverlay {
                FriendStateOverlayView()
            } else if viewModel.isFinished && viewModel.posts.isEmpty {
                EmptyFeedOverlayView(description: emptyFeedMessage())
            }
        }
        .sheet(isPresented: $showSubmit, onDismiss: refreshPosts) {
            PostCreateView(person: person)
        }
    }
    
    // Helper Methods
    private func loadMorePostsIfNeeded(currentPost: Post) {
        Task {
            if viewModel.hasReachedEnd(of: currentPost) && !viewModel.isFetching {
                await viewModel.getNextPosts(user: userHolder.person, person: person)
            }
        }
    }
    
    private func refreshPosts() {
        Task {
            try? await viewModel.getPosts(user: userHolder.person, person: person)
        }
    }

    private func emptyFeedMessage() -> String {
        if profileOrFeed == "feed" {
            switch viewModel.selectedStatus {
            case .pinned: return "You need to pin a post to see it here."
            case .answered: return "No posts have been 'answered' yet."
            case .noLongerNeeded: return "No posts have been marked as 'no longer needed'."
            default: return "Link friends to your calendar to start seeing prayer requests."
            }
        } else {
            switch viewModel.selectedStatus {
            case .pinned: return "You need to pin a post to see it here."
            case .answered: return person.isCurrentUser(userHolder) ? "No answered posts yet." : "\(person.firstName) has no answered posts."
            default: return person.isCurrentUser(userHolder) ? "Start adding posts to the list." : "\(person.firstName) has no posts to share."
            }
        }
    }
}

private struct FriendStateOverlayView: View {
    var body: some View {
        VStack {
            ContentUnavailableView {
                Label("Not Friends Yet", systemImage: "lock.square")
            } description: {
                Text("You must be friends with this account before you can see their posts.")
            }
            .frame(height: 200)
            .offset(y: 140)
            Spacer()
        }
    }
}

private struct EmptyFeedOverlayView: View {
    let description: String

    var body: some View {
        VStack {
            ContentUnavailableView {
                Label("No Posts Available...Yet!", systemImage: "list.bullet.rectangle.portrait")
            } description: {
                Text(description)
            } actions: {
                Button(action: {}) {
                    Text("Add a Post")
                        .font(.system(size: 16))
                }
            }
            .frame(height: 500)
            .offset(y: 140)
            Spacer()
        }
    }
}

extension Person {
    var friendStateRequiresOverlay: Bool {
        friendState == "pending" || friendState == "sent"
    }
    
    func isCurrentUser(_ userHolder: UserProfileHolder) -> Bool {
        userID == userHolder.person.userID
    }
}
