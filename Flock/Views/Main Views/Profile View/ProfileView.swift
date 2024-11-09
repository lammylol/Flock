//
//  ProfileView.swift
//  PrayerCalendar
//
//  Created by Matt Lam on 10/6/23.
//
// Description: ProfileView with conditional statements changing the view depending on whether it is your profile you are viewing or someone else's.

import SwiftUI
import SwiftData
import FirebaseAuth
import FirebaseFirestore

struct ProfileView: View {
    @Environment(UserProfileHolder.self) var userHolder
    @Environment(NavigationManager.self) var navigationManager
    @Environment(\.colorScheme) var colorScheme
    
    @State var person: Person
    @State private var showSubmit = false
    @State private var viewModel = FeedViewModel(viewType: .profile, selectionType: .myPosts)
    @State private var pinnedPostsViewModel = FeedViewModel(viewType: .profile, selectionType: .myPostsPinned)
    @State private var addFriendConfirmation = false
    @State private var seeAllMyPosts: Bool = false
    
    var userService = UserService()
    var friendService = FriendService()
    var friendHelper = FriendHelper()

    var body: some View {
        ScrollView(.vertical) {
            VStack(alignment: .leading, spacing: 20) {
                profileHeader
                postSections
            }
            .padding(.top, -8)
            .padding(.horizontal, 20)
        }
        .navigationTitle(person.fullName.capitalized)
        .navigationBarTitleDisplayMode(.large)
        .task {
            // wait for user profile to load first, then call other functions. If not, the functions will call multiple times.
            if !userHolder.profileViewIsLoading {
                await loadProfile()
                
                if !pinnedPostsViewModel.isLoading {
                    await loadPosts(for: pinnedPostsViewModel)
                }
                
                if !viewModel.isLoading && !person.friendStateRequiresOverlay {
                    await loadPosts(for: viewModel)
                }
            }
        }
        .refreshable { await refreshPosts() }
        .toolbar { profileToolbar }
        .sheet(isPresented: $showSubmit, onDismiss: { Task { await refreshPosts() } }) {
            PostCreateView(person: person)
        }
        .alert(isPresented: $addFriendConfirmation, content: friendRequestAlert)
        .scrollIndicators(.hidden)
    }
    
    // MARK: - Profile Header
    private var profileHeader: some View {
        VStack(alignment: .leading) {
            Text(person.usernameDisplay)
                .font(.system(size: 14))
            if !userHolder.profileViewIsLoading {
                friendStateButton.padding(.top, 3)
            } else if person.username != userHolder.person.username {
                clearTagView.padding(.top, 3)
            }
        }
    }
    
    // MARK: - Post Sections
    private var postSections: some View {
        VStack(spacing: 15) {
            pinnedPostsSection
            mainPostsSection
        }
    }
    
    private var pinnedPostsSection: some View {
        VStack {
            if !pinnedPostsViewModel.posts.isEmpty {
                if pinnedPostsViewModel.posts.count > 2 {
                    SectionHeader(
                        title: "My Pinned Prayers",
                        icon: "signpost.right.and.left.fill",
                        actionLabel: seeAllMyPosts ? "Show Less" : "Show All",
                        action: { seeAllMyPosts.toggle() }
                    )
                } else {
                    SectionHeader(
                        title: "My Pinned Prayers",
                        icon: "signpost.right.and.left.fill"
                    )
                }
                PostCardLayout(viewModel: pinnedPostsViewModel, isExpanded: seeAllMyPosts)
            }
        }
    }
    
    private var mainPostsSection: some View {
        VStack {
            HStack {
                SectionHeader(
                    title: person.isUser ? "My Posts" : "\(person.firstName.capitalized)'s Posts",
                    icon: "newspaper.fill"
                )
                StatusPicker(viewModel: viewModel)
                    .onChange(of: viewModel.selectedStatus) {
                        Task {
                            if !viewModel.isFetching || !viewModel.isLoading {
                                try await viewModel.getPosts(user: userHolder.person, person: person)
                            }
                        }
                    }
            }
            Divider()
            PostsFeed(viewModel: viewModel, person: person, profileOrFeed: "profile")
        }
    }
    
    // MARK: - Friend State Button
    private var friendStateButton: some View {
        Group {
            switch person.friendState {
            case "pending": friendRequestMenu
            case "approved": TagModelView(textLabel: "Friends", systemImage: "checkmark.circle.fill", textSize: 14, foregroundColor: .primary, backgroundColor: .gray.opacity(0.3))
            case "sent": TagModelView(textLabel: "Pending", textSize: 14, foregroundColor: .black, backgroundColor: .gray.opacity(0.3))
            case "private": TagModelView(textLabel: "Private", systemImage: "lock.icloud.fill", textSize: 14, foregroundColor: .primary, backgroundColor: .gray.opacity(0.3))
            default:
                if person.isPublic && person.username != userHolder.person.username {
                    addFriendButton
                }
            }
        }
    }
    
    private var friendRequestMenu: some View {
        Menu {
            Button("Approve Request", action: acceptFriendRequest)
            Button("Dismiss Request", action: dismissFriendRequest)
        } label: {
            TagModelView(textLabel: "Respond to Friend Request", systemImage: "arrowtriangle.down.circle.fill", textSize: 14, foregroundColor: .white, backgroundColor: .blue)
        }
    }
    
    private var addFriendButton: some View {
        Button(action: addFriend) {
            TagModelView(textLabel: "Add Friend", textSize: 14, foregroundColor: .white, backgroundColor: .blue)
        }
    }
    
    private var clearTagView: some View {
        TagModelView(textLabel: "T", textSize: 14, foregroundColor: .clear, backgroundColor: .clear)
    }
    
    // MARK: - Profile Toolbar
    private var profileToolbar: some ToolbarContent {
        Group {
            ToolbarItem(placement: .topBarLeading) {
                if buildConfiguration == DEVELOPMENT {
                    Text("DEVELOPMENT")
                        .font(.title2)
                        .bold()
                        .padding(.leading, 10)
                }
            }
            ToolbarItemGroup(placement: .topBarTrailing) {
                if person.userID == userHolder.person.userID {
                    NavigationLink(destination: ProfileSettingsView()) { Image(systemName: "gear") }
                    Button { showSubmit.toggle() } label: { Image(systemName: "square.and.pencil") }
                }
            }
        }
    }
    
    // MARK: - Friend Request Alert
    private func friendRequestAlert() -> Alert {
        Alert(
            title: Text("Request Sent"),
            message: Text("Your friend will appear in your list once the request has been approved."),
            dismissButton: .default(Text("OK")) { addFriendConfirmation = false }
        )
    }
    
    // MARK: - Actions & Data Loading
    @MainActor
    private func loadProfile() async {
        // Set loading state at start
        userHolder.profileViewIsLoading = true
        defer { userHolder.profileViewIsLoading = false } // Ensure loading ends when function exits

        do {
            // Fetch and update person data
            person = try await userService.retrieveUserInfoFromUserID(person: person, userHolder: userHolder)
        } catch {
            // Log errors for debugging
            ViewLogger.error("Error loading profile data in ProfileView: \(error.localizedDescription)")
        }
    }
    
    private func loadPosts(for viewModel: FeedViewModel) async {
        do {
            try await viewModel.getPosts(user: userHolder.person, person: person)
        } catch {
            ViewLogger.error("ProfileView Initial Post Load: \(error)")
        }
    }
    
    private func refreshPosts() async {
        if viewModel.isFinished && pinnedPostsViewModel.isFinished {
            do {
                try await viewModel.getPosts(user: userHolder.person, person: person)
                try await pinnedPostsViewModel.getPosts(user: userHolder.person, person: person)
                
                self.pinnedPostsViewModel.posts = pinnedPostsViewModel.posts
            } catch {
                ViewLogger.error("ProfileView \(error)")
            }
        }
    }
    
    private func addFriend() {
        Task {
            do {
                try await friendService.addFriend(user: userHolder.person, friend: person)
                addFriendConfirmation = true
                person.friendState = "sent"
            } catch {
                ViewLogger.error("ProfileView.addFriend \(error)")
            }
        }
    }
    
    private func acceptFriendRequest() {
        Task {
            friendHelper.acceptFriendRequest(friendState: person.friendState, user: userHolder.person, friend: person)
            person.friendState = "approved"
            try await viewModel.getPosts(user: userHolder.person, person: person)
        }
    }
    
    private func dismissFriendRequest() {
        Task {
            friendHelper.denyFriendRequest(friendState: person.friendState, user: userHolder.person, friend: person)
            person.friendState = ""
        }
    }
}

// MARK: - Section Header Component
struct SectionHeader: View {
    let title: String
    let icon: String?
    let actionLabel: String?
    let action: (() -> Void)?
    
    init(title: String, icon: String? = nil, actionLabel: String? = nil, action: (() -> Void)? = nil) {
        self.title = title
        self.icon = icon
        self.actionLabel = actionLabel
        self.action = action
    }
    
    var body: some View {
        HStack {
            if let icon = icon {
                Image(systemName: icon)
                    .font(.title3)
                    .foregroundColor(.primary)
            }
            Text(title)
                .font(.title3)
                .bold()
            Spacer()
            if let actionLabel = actionLabel, let action = action {
                Button(action: action) {
                    Text(actionLabel)
                        .font(.system(size: 16))
                }
            }
        }
    }
}

// MARK: - Extensions for Helper Display Logic
extension Person {
    var usernameDisplay: String {
        username.isEmpty ? "private profile" : "@\(username)"
    }
}
