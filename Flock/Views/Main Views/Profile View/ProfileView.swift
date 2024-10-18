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
    @Environment(\.colorScheme) var colorScheme
    
    @State public var person: Person
    @State private var showSubmit = false
    @State private var viewModel = FeedViewModel(viewType: .profile, selectionType: .myPosts)
    @State private var pinnedPostsViewModel = FeedViewModel(viewType: .profile, selectionType: .myPostsPinned)
    @State private var navigationPath = NavigationPath()
    @State private var addFriendConfirmation = false
    
    var userService = UserService()
    var friendService = FriendService()
    var friendHelper = FriendHelper()
    
    var body: some View {
        NavigationStack(path: $navigationPath) {
            ScrollView {
                VStack(alignment: .leading, spacing: 20) {
                    profileHeader
                    postSections
                }
                .padding(.top, -8)
                .padding([.leading, .trailing], 23)
            }
            .task { await loadProfile() }
            .refreshable { await refreshPosts() }
            .navigationTitle(person.fullName.capitalized)
            .navigationBarTitleDisplayMode(.large)
            .toolbar { profileToolbar }
            .sheet(isPresented: $showSubmit, onDismiss: {
                Task { await refreshPosts() }
            }, content: {
                PostCreateView(person: person)
            })
            .alert(isPresented: $addFriendConfirmation, content: friendRequestAlert)
            .navigationDestination(for: String.self, destination: navigationDestination)
            .navigationDestination(for: Post.self) { post in
                PostFullView(
                    person: Person(userID: post.userID, username: post.username, firstName: post.firstName, lastName: post.lastName),
                    originalPost: .constant(post) // Pass binding for post
                )
            }
        }
    }
    
    // Profile header
    private var profileHeader: some View {
        VStack(alignment: .leading) {
            Text(usernameDisplay())
                .font(.system(size: 14))

            if !userHolder.profileViewIsLoading {
                friendStateButton.padding(.top, 3)
            } else if person.username != userHolder.person.username {
                clearTagView.padding(.top, 3)
            }
        }
    }
    
    // Post sections
    private var postSections: some View {
        LazyVStack (spacing: 15) {
            VStack (spacing: 0) {
                if !pinnedPostsViewModel.isLoading && !pinnedPostsViewModel.posts.isEmpty {
                    sectionHeader(systemImage: Image(systemName: "signpost.right.and.left.fill"), title: "My Pinned Posts", fontWeight: .medium)
                }
                PostCardLayout(navigationPath: $navigationPath, viewModel: $pinnedPostsViewModel, posts: pinnedPostsViewModel.posts)
                    .padding(.leading, 0) // Padding on leading
                    .padding(.trailing, -25)
                    .task {
                        if pinnedPostsViewModel.posts.isEmpty {
                            await loadPinnedPosts()
                        }
                    }
            }
            VStack {
                HStack {
                    sectionHeader(systemImage: Image(systemName: "newspaper.fill"), title: person.username == userHolder.person.username ? "My Posts" : "\(person.firstName.capitalized)'s Posts", fontWeight: .medium)
                    Spacer()
                    HStack {
                        if viewModel.selectedStatus == .noLongerNeeded {
                            Text("No Longer\nNeeded")
                                .font(.system(size: 14))
                                .multilineTextAlignment(.trailing)
                        } else {
                            Text(viewModel.selectedStatus.rawValue.capitalized)
                                .font(.system(size: 16))
                                .multilineTextAlignment(.trailing)
                        }
                        StatusPicker(viewModel: viewModel)
                            .onChange(of: viewModel.selectedStatus, {
                                Task {
                                    if !viewModel.isFetching || !viewModel.isLoading {
                                        try await viewModel.getPosts(user: userHolder.person, person: person)
                                    }
                                }
                            })
                    }
                }
                Divider()
                PostsFeed(viewModel: viewModel, person: $person, profileOrFeed: "profile")
            }
        }
    }
    
    // Friend state button
    private var friendStateButton: some View {
        Group {
            switch person.friendState {
            case "pending":
                friendRequestMenu
            case "approved":
                tagModelView(textLabel: "Friends", systemImage: "checkmark.circle.fill", textSize: 14, foregroundColor: .primary, backgroundColor: .gray.opacity(0.3))
            case "sent":
                tagModelView(textLabel: "Pending", textSize: 14, foregroundColor: .black, backgroundColor: .gray.opacity(0.3))
            case "private":
                tagModelView(textLabel: "Private", systemImage: "lock.icloud.fill", textSize: 14, foregroundColor: .primary, backgroundColor: .gray.opacity(0.3))
            default:
                if person.isPublic && person.username != userHolder.person.username {
                    addFriendButton
                } else {
                    EmptyView()
                }
            }
        }
    }
    
    // Friend request menu
    private var friendRequestMenu: some View {
        Menu {
            Button { acceptFriendRequest() } label: { Label("Approve Request", systemImage: "person.crop.circle.badge.plus") }
            Button { dismissFriendRequest() } label: { Label("Dismiss Request", systemImage: "xmark.circle") }
        } label: {
            tagModelView(textLabel: "Respond to Friend Request", systemImage: "arrowtriangle.down.circle.fill", textSize: 14, foregroundColor: .white, backgroundColor: .blue)
        }
    }
    
    // Add friend button
    private var addFriendButton: some View {
        if person.isPublic && person.username != userHolder.person.username {
            AnyView(
                Button { addFriend() } label: {
                tagModelView(textLabel: "Add Friend", textSize: 14, foregroundColor: .white, backgroundColor: .blue)}
            )
        } else {
            AnyView(EmptyView())
        }
    }
    
    // Profile toolbar
    private var profileToolbar: some ToolbarContent {
        Group {
            ToolbarItem(placement: .topBarLeading) {
                HStack {
                    if buildConfiguration == DEVELOPMENT {
                        Text("DEVELOPMENT")
                            .font(.title2)
                            .bold()
                            .padding(.leading, 10) // Moved padding here
                    }
                }
                .frame(maxWidth: .infinity) // Moved the frame modifier here
            }
            
            ToolbarItemGroup(placement: .topBarTrailing) {
                if person.userID == userHolder.person.userID {
                    Button(action: { navigationPath.append("settings") }) {
                        Image(systemName: "gear")
                            .padding(.trailing, -18)
                            .padding(.top, 3)
                    }
                    Button(action: { showSubmit.toggle() }) {
                        Image(systemName: "square.and.pencil")
                    }
                }
            }
        }
    }

    
    // Friend request alert
    private func friendRequestAlert() -> Alert {
        Alert(
            title: Text("Request Sent"),
            message: Text("Your friend will appear in your list once the request has been approved."),
            dismissButton: .default(Text("OK")) { addFriendConfirmation = false }
        )
    }
    
    // Navigation destination
    private func navigationDestination(for value: String) -> some View {
        switch value {
        case "settings":
            return AnyView(ProfileSettingsView())
        default:
            return AnyView(EmptyView()) // Provide an empty view for other cases
        }
    }
    
    // Helper functions
    private func usernameDisplay() -> String {
        person.username.isEmpty ? "private profile" : "@\(person.username)"
    }
    
    private func sectionHeader(systemImage: Image? = nil, title: String, fontWeight: Font.Weight? = .bold, fontSize: CGFloat? = 18) -> some View {
        HStack {
            if let image = systemImage {
                
                image
                    .resizable()
                    .scaledToFit() // Maintain aspect ratio
                    .frame(width: fontSize, height: fontSize) // Match the frame size to the font size
                    .font(.system(size: fontSize ?? 18)) // Set the same font size for consistency
            }
            
            Text(title)
                .font(.title3)
                .fontWeight(fontWeight)
                .frame(maxWidth: .infinity, alignment: .leading)
            Spacer()
        }
    }
    
    private var clearTagView: some View {
        tagModelView(textLabel: "T", textSize: 14, foregroundColor: .clear, backgroundColor: .clear)
    }
    
    private func loadProfile() async {
        // Start loading
        DispatchQueue.main.async {
            userHolder.profileViewIsLoading = true
        }
        
        defer {
            DispatchQueue.main.async {
                userHolder.profileViewIsLoading = false
            }
        }
        
        do {
            person = try await userService.retrieveUserInfoFromUserID(person: person, userHolder: userHolder)
        } catch {
            ViewLogger.error("ProfileView \(error)")
        }
    }
    
    private func loadPinnedPosts() async {
        do {
            try await pinnedPostsViewModel.getPosts(user: userHolder.person, person: person)
        } catch {
            ViewLogger.error("ProfileView Pinned Posts \(error)")
        }
    }
    
    private func refreshPosts() async {
        if viewModel.isFinished {
            do {
                try await viewModel.getPosts(user: userHolder.person, person: person)
                try await pinnedPostsViewModel.getPosts(user: userHolder.person, person: person)
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

//#Preview {
//    ProfileView(person: Person(userID: "aMq0YdteGEbYXWlSgxehVy7Fyrl2", username: "lammylol"))
//        .environment(UserProfileHolder())
//}
