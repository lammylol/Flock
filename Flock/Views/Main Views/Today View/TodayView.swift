//
//  TodayView.swift
//  Flock
//
//  Created by Matt Lam on 10/15/24.
//

import SwiftUI

struct TodayView: View {
    @Environment(UserProfileHolder.self) var userHolder
    @Environment(NavigationManager.self) var navigationManager
    
    @State private var myFriendsPostsViewModel = FeedViewModel(viewType: .today, selectionType: .myFriendPostsPinned)
    @State private var myPostsViewModel = FeedViewModel(viewType: .today, selectionType: .myPostsPinned)
    
    @State private var date: Date = Date()
    @State private var post: Post = Post()
    @State private var postText: String = ""
    @State private var postType: Post.PostType = .prayerRequest
    @State private var privacy: String = "private"
    @State private var isPresentingFriends: Bool = false
    @State private var showCreatePost: Bool = false
    @State private var seeAllFriendsPosts: Bool = false
    @State private var seeAllMyPosts: Bool = false
    
    @FocusState private var isTextFieldFocused: Bool
    
    @State private var notificationViewModel = NotificationViewModel()
    @State private var isPresentingNotifications: Bool = false

    var body: some View {
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
        .refreshable { await refreshPosts() }
        .toolbarBackground(Color.primary, for: .bottomBar)
        .sheet(isPresented: $showCreatePost) {
            PostCreateView(person: userHolder.person, postType: postType)
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
                
                NavigationLink(destination: NotificationSheet(viewModel: notificationViewModel)) {
                    ZStack(alignment: .topTrailing) {
                        Image(systemName: "bell.fill")
                            .font(.system(size: 20))
                            .foregroundStyle(Color.primary)
                        
                        if notificationViewModel.unreadCount > 0 {
                            Text("\(notificationViewModel.unreadCount)")
                                .font(.system(size: 12))
                                .foregroundColor(.white)
                                .padding(4)
                                .background(Color.blue)
                                .clipShape(Circle())
                                .offset(x: 10, y: -10)
                        }
                    }
                }
            }
            .padding(.top, 30)
        }
    }
    
    // MARK: - What's On Your Mind View
    private func addPostView() -> some View {
        VStack (alignment: .leading, spacing: 5) {
            
            sectionHeader(systemImage: Image(systemName: "ellipsis.message.fill"), text: "What's On Your Mind?")
            
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
            .padding(.leading, 10)
            
            Button {
                showCreatePost.toggle()
            } label: {
                postTextView()
                    .padding(.all, 10)
                    .frame(maxWidth: .infinity, minHeight: 80, alignment: .topLeading) // Constraint the text to max height of 80
                    .background {
                        RoundedRectangle(cornerRadius: 8)
                            .fill(Color(UIColor.systemGray6))
                            .frame(maxWidth: .infinity)
                            .frame(height: 80) // Fix background height to 80
                    }
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }
    
    // MARK: - My Prayers View
    private func myPrayersView() -> some View {
        VStack(alignment: .leading, spacing: 5) {
            HStack {
                sectionHeader(systemImage: Image(systemName: "person.fill"), text: "My Pinned Prayers")
                Spacer()
                if myPostsViewModel.posts.count > 2 { // temporary static 2 for now.
                    Button {
                        seeAllMyPosts.toggle()
                    } label: {
                        Text(seeAllMyPosts ? "Show Less" : "Show All")
                            .font(.system(size: 16))
                    }
                }
            }
            
            PostCardLayout(viewModel: myPostsViewModel, isExpanded: seeAllMyPosts)
                .task {
                    if myPostsViewModel.posts.isEmpty {
                        await loadPinnedPosts(for: myPostsViewModel)
                    }
                }
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }
    
    // MARK: - Friend Prayers View
    private func myFriendsView() -> some View {
        VStack(alignment: .leading, spacing: 5) {
            HStack {
                sectionHeader(systemImage: Image(systemName: "person.2.fill"), text: "My Friend's Prayers")
                Spacer()
                if myFriendsPostsViewModel.posts.count > 2 { // temporary static 2 for now.
                    Button {
                        seeAllFriendsPosts.toggle()
                    } label: {
                        Text(seeAllFriendsPosts ? "Show Less" : "Show All")
                            .font(.system(size: 16))
                    }
                }
            }
            
            PostCardLayout(viewModel: myFriendsPostsViewModel, isExpanded: seeAllFriendsPosts)
                .task {
                    if myFriendsPostsViewModel.posts.isEmpty {
                        await loadPinnedPosts(for: myFriendsPostsViewModel)
                    }
                }
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }
    
    // MARK: - Helper Views & Functions
    private func sectionHeader(systemImage: Image, text: String) -> some View {
        HStack(alignment: .center, spacing: 5) {
            systemImage
            Text(text)
                .font(.system(size: 20))
                .fontWeight(.medium)
            Spacer()
        }
    }
    
    private func postTextView() -> some View {
        HStack (alignment: .top) {
            if postType == .note {
                Text("Share what's on your mind. It can be a thought, an encouragement, or anything that God has placed on your heart.")
            } else if postType == .praise {
                Text("Share a praise report! What have seen God do in your life or in the lives of those around you?")
            } else {
                Text("Enter a prayer request. You can track this privately or have the option to share with others.")
            }
        }
        .foregroundColor(.gray)
        .font(.system(size: 16))
        .multilineTextAlignment(.leading)
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
    
    private func loadPinnedPosts(for viewModel: FeedViewModel) async {
        do {
            try await viewModel.getPosts(user: userHolder.person)
        } catch {
            ViewLogger.error("TodayView Pinned Posts \(error)")
        }
    }
    
    private func refreshPosts() async {
        if myPostsViewModel.isFinished && myFriendsPostsViewModel.isFinished {
            do {
                try await myFriendsPostsViewModel.getPosts(user: userHolder.person)
                try await myPostsViewModel.getPosts(user: userHolder.person)
            } catch {
                ViewLogger.error("ProfileView \(error)")
            }
        }
    }
}

#Preview {
    TodayView()
}
