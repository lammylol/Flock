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
        ZStack {
            (colorScheme == .dark ? Color.black : Color.white).ignoresSafeArea()
            
            LazyVStack {
                ForEach($viewModel.posts) { $post in
                    VStack {
                        NavigationLink(destination: PostFullView(post: $post)) {
                            PostRow(viewModel: viewModel, post: $post)
                        }
                        Divider()
                    }
                    .onAppear {
                        loadMorePostsIfNeeded(currentPost: post)
                    }
                }
            }
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .top)
        .task {
            loadInitialPostsIfNeeded()
        }
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

    private func loadInitialPostsIfNeeded() {
        Task {
            if viewModel.posts.isEmpty && !viewModel.isFetching && !person.friendStateRequiresOverlay {
                try? await viewModel.getPosts(user: userHolder.person, person: person)
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

//
//struct PostsFeed: View {
//    
//    @State var viewModel: FeedViewModel
//    @Environment(UserProfileHolder.self) var userHolder
//    @Environment(\.colorScheme) var colorScheme
//    @State var person: Person
//    @State var profileOrFeed: String = "feed"
//    @State private var showSubmit: Bool = false
//    
//    var userService = UserService()
//    
//    var body: some View {
//        ZStack {
//            (colorScheme == .dark ? Color.black : Color.white).ignoresSafeArea() // sets background color.
//                
//            LazyVStack {
//                ForEach($viewModel.posts) { $post in
//                    VStack {
//                        NavigationLink(destination: PostFullView(post: $post)) {
//                            PostRow(viewModel: viewModel, post: $post)
//                        }
//                        Rectangle()
//                            .frame(height: 4)
//                            .foregroundStyle(.bar)
//                    }
//                    .onAppear {
//                        Task {
//                            if viewModel.hasReachedEnd(of: post) && !viewModel.isFetching {
//                                await viewModel.getNextPosts(user: userHolder.person, person: person)
//                            }
//                        }
//                    }
//                }
//            }
////            .scrollContentBackground(.hidden)
//        }
//        .task {
//            if viewModel.posts.isEmpty {
//                if !viewModel.isFetching || !viewModel.isLoading {
//                    if person.friendState == "sent" || person.friendState == "pending" {
//                        return
//                    }
//                    do {
//                        try await viewModel.getPosts(user: userHolder.person, person: person)
//                        self.viewModel.posts = viewModel.posts
//                    } catch {
//                        ViewLogger.error("PostsFeed viewModel.getPosts \(error.localizedDescription)")
//                    }
//                }
//            }
//        }
//        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .top)
//        .overlay {
//            if person.friendState == "pending" || person.friendState == "sent" { // overlay if profile has not been friended yet.
//                VStack{
//                    ContentUnavailableView {
//                        Label("Not Friends Yet", systemImage: "lock.square")
//                    } description: {
//                        Text("You must be friends with this account before you can see their posts.")
//                    }
//                    .frame(height: 200)
//                    .offset(y: 140)
//                    Spacer()
//                }
//            } else if viewModel.posts.isEmpty && viewModel.isFinished { // overlay for 'no posts available'
//                VStack{
//                    ContentUnavailableView {
//                        Label("No Posts Available...Yet!", systemImage: "list.bullet.rectangle.portrait")
//                    } description: {
//                        if profileOrFeed == "feed" {
//                            if viewModel.selectedStatus == .pinned {
//                                Text("You will need to pin an exisiting post to see posts here")
//                            } else if viewModel.selectedStatus == .answered {
//                                Text("No posts have been 'answered' yet. They will be featured here once you change the status to answered.")
//                            } else if viewModel.selectedStatus == .noLongerNeeded {
//                                Text("No posts have been marked as 'no longer needed.'")
//                            } else {
//                                Text("Link friends to your calendar to start seeing prayer requests. Or, you can add prayers to your profile or to a private account and they'll also be featured here.")
//                            }
//                        } else {
//                            if viewModel.selectedStatus == .pinned {
//                                Text("You will need to pin an exisiting post to see posts here")
//                            } else if viewModel.selectedStatus == .answered {
//                                // Only show this if this account is saved under your userID.
//                                if person.username == "" || person.userID == userHolder.person.userID {
//                                    Text("None of your posts have been 'answered' yet, but that's okay! They will be featured here once you change the status to answered.")
//                                } else {
//                                    Text("\(person.firstName) has no answered posts yet.")
//                                }
//                            } else if viewModel.selectedStatus == .answered {
//                                Text("") // Empty. Just shows the main description.
//                            } else {
//                                if person.username == "" || person.userID == userHolder.person.userID {
//                                    Text("Start adding posts to the list")
//                                } else {
//                                    Text("\(person.firstName) has no posts to share.")
//                                }
//                            }
//                        }
//                    } actions: {
//                        if profileOrFeed == "feed" {
//                            if viewModel.selectedStatus == .current {
//                                Button(action: {showSubmit.toggle() })
//                                {
//                                    Text("Add a Post")
//                                        .font(.system(size: 16))
//                                }
//                            }
//                        } else {
//                            if viewModel.selectedStatus == .current {
//                                if person.username == "" || person.userID == userHolder.person.userID {
//                                    Button(action: {showSubmit.toggle() })
//                                    {
//                                        Text("Add a Post")
//                                            .font(.system(size: 16))
//                                    }
//                                }
//                            }
//                        }
//                    }
//                    .frame(height: 500)
//                    .offset(y: 140)
//                    Spacer()
//                }
//        }
//        }
//        .sheet(isPresented: $showSubmit, onDismiss: {
//            Task {
//                do {
//                    self.person = try await userService.retrieveUserInfoFromUserID(person: person, userHolder: userHolder)
//                    
//                    if !viewModel.isFetching || !viewModel.isLoading {
//                        try await viewModel.getPosts(user: userHolder.person, person: person)
//                        self.viewModel.posts = viewModel.posts
//                    }
//                } catch {
//                    ViewLogger.error("PostsFeed \(error.localizedDescription)")
//                }
//            }
//        }, content: {
//            PostCreateView(person: person)
//        })
//    }
//}
//
////#Preview {
////    PrayerFeedRowView()
////}
