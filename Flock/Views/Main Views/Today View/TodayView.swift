//
//  TodayView.swift
//  Flock
//
//  Created by Matt Lam on 10/15/24.
//

import SwiftUI

struct TodayView: View {
    @Environment(UserProfileHolder.self) var userHolder
    
    @State private var myFriendsPostsViewModel = FeedViewModel(viewType: .today, selectionType: .myFriendPostsPinned)
    @State private var myPostsViewModel = FeedViewModel(viewType: .today, selectionType: .myPosts)
    @State private var navigationPath = NavigationPath()
    
    @State private var date: Date = Date()
    @State private var post: Post = Post()
    @State private var postText: String = ""
    @State private var postType: Post.PostType = .prayerRequest
    @State private var privacy: String = "private"
    @State private var isPresentingFriends: Bool = false
    
    @FocusState private var isTextFieldFocused: Bool
    
    var body: some View {
        NavigationStack(path: $navigationPath) {
            ScrollView {
                VStack (alignment: .leading, spacing: 20) {
                    headerView()
                    addPostView()
                    myPrayersView()
                    myFriendsView()
                }
                .frame(maxWidth: .infinity)
                .padding(.horizontal, 20)
            }
            .clipped(antialiased: true)
            .scrollDismissesKeyboard(.automatic)
            .scrollIndicators(.hidden)
            .refreshable(action: { Task { refreshPosts } })
            .navigationDestination(for: Post.self) { post in
                PostFullView(
                    person: Person(userID: post.userID, username: post.username, firstName: post.firstName, lastName: post.lastName),
                    originalPost: .constant(post) // Pass binding for post
                )
            }
            .toolbarBackground(Color.primary, for: .bottomBar)
        }
    }
    
    // MARK: - Header View
    private func headerView() -> some View {
        VStack (alignment: .leading, spacing: 10) {
            HStack (spacing: 5) {
                Text("Today")
                    .font(Font.title)
                    .bold()
                Text(dateFormatter(for: date))
                    .font(Font.title)
                    .fontWeight(.light)
                Spacer()
            }
            .padding(.top, 20)
        }
    }
    
    // MARK: - What's On Your Mind View
    private func addPostView() -> some View {
        VStack (alignment: .leading, spacing: 5) {
            
            sectionHeader(systemImage: Image(systemName: "arrow.up.right.square.fill"), text: "What's On Your Mind?")
            
            HStack (spacing: -5) {
                Text("Add a")
                Picker(selection: $postType) {
                    ForEach(Post.PostType.allCases, id: \.self) { type in
                        Text(type.rawValue).tag(type.rawValue)
                    }
                } label : {
                    Text(postType.rawValue)
                        .bold()
                        .foregroundStyle(Color.blue)
                }
                Spacer()
            }
            
            ZStack (alignment: .topLeading) {
                RoundedRectangle(cornerRadius: 8)
                    .fill(Color(UIColor.systemGray6))
                    .frame(maxWidth: .infinity, minHeight: 80)
                
                TextEditor(text: $postText)
                    .font(.system(size: 16))
                    .focused($isTextFieldFocused)
                    .scrollContentBackground(.hidden)
                    .padding(.horizontal, 5)
                
                if postText.isEmpty {
                    placeHolder()
                        .padding(.all, 8)
                }
            }
            .frame(maxWidth: .infinity, maxHeight: .infinity)
            .gesture(
                DragGesture()
                    .onEnded { value in
                        if value.translation.height > 0 {
                            isTextFieldFocused = false // Dismiss the keyboard when swiping up
                        }
                    }
            )
            
            HStack (alignment: .center) {
                PrivacyView(person: userHolder.person, privacySetting: $privacy)
                    .onChange(of: privacy, {
                        if privacy == "public" {
                            isPresentingFriends = true
                        }
                    })
                Spacer()
                tagModelView(textLabel: "Post", textSize: 14, foregroundColor: .white, backgroundColor: .blue)
            }
            .padding(.top, 3)
            
            if privacy == "public" {
                HStack {
                    friendsList()
                    Spacer()
                }
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }
    
    // MARK: - Friend Prayers View
    private func myFriendsView() -> some View {
        VStack(alignment: .leading, spacing: 5) {
            sectionHeader(systemImage: Image(systemName: "signpost.right.and.left.fill"), text: "My Friend's Prayers")
            
            PostCardLayout(navigationPath: $navigationPath, viewModel: $myFriendsPostsViewModel, posts: myFriendsPostsViewModel.posts)
                .padding(.leading, 0) // Padding on leading
                .padding(.trailing, -25)
                .task {
                    if myFriendsPostsViewModel.posts.isEmpty {
                        await loadPinnedPosts()
                    }
                }
        }
    }
    
    // MARK: - My Prayers View
    private func myPrayersView() -> some View {
        VStack(alignment: .leading, spacing: 5) {
            sectionHeader(systemImage: Image(systemName: "signpost.right.and.left.fill"), text: "My Prayers")
            
            PostCardLayout(navigationPath: $navigationPath, viewModel: $myPostsViewModel, posts: myPostsViewModel.posts)
                .padding(.leading, 0) // Padding on leading
                .padding(.trailing, -25)
                .task {
                    if myPostsViewModel.posts.isEmpty {
                        await loadPinnedPosts()
                    }
                }
        }
    }
    
    // MARK: - Helper Views & Functions
    private func sectionHeader(systemImage: Image, text: String) -> some View {
        HStack (alignment: .center, spacing: 5) {
            systemImage
            Text(text)
                .font(.system(size: 20))
                .fontWeight(.medium)
            Spacer()
        }
    }
    
    private func placeHolder() -> some View {
        HStack {
            if postType == .note {
                Text("Share what's on your mind. It can be a thought, an encouragement, or anything that God has placed on your heart.")
            } else if postType == .praise {
                Text("Share a praise report! What have seen God do in your life or in the lives of those around you?")
            } else {
                Text("Share a prayer request. Consider sharing your post in the form of a prayer so that readers can join with you in prayer as they read it.")
            }
        }
        .foregroundColor(.gray)
        .font(.system(size: 16))
        .allowsHitTesting(false) // Make sure the placeholder doesn't block touches
    }
    
    private func friendsList() -> some View {
        VStack (alignment: .leading) {
            HStack {
                Text("Who can see this post?")
                    .multilineTextAlignment(.leading)
                    .padding(.bottom, 1)
                NavigationLink(destination: FriendsPageView()) {
                    Text("See Friends")
                        .font(.system(size: 12))
                        .italic()
                }
                Spacer()
            }
            .font(.system(size: 12))
            .padding(.bottom, 10)
        }
    }
    
    private func dateFormatter(for date: Date) -> String {
        let formatter = DateFormatter()
        formatter.dateFormat = "MMMM d"
        return formatter.string(from: date)
    }
    
    private func loadPinnedPosts() async {
        do {
            try await myFriendsPostsViewModel.getPosts(user: userHolder.person)
            try await myPostsViewModel.getPosts(user: userHolder.person, person: userHolder.person)
        } catch {
            ViewLogger.error("ProfileView Pinned Posts \(error)")
        }
    }
    
    private func refreshPosts() async {
        if myPostsViewModel.isFinished && myFriendsPostsViewModel.isFinished {
            do {
                try await myFriendsPostsViewModel.getPosts(user: userHolder.person)
                try await myPostsViewModel.getPosts(user: userHolder.person, person: userHolder.person)
            } catch {
                ViewLogger.error("ProfileView \(error)")
            }
        }
    }
}

#Preview {
    TodayView()
}
