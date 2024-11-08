//
//  EditPrayerRequestForm.swift
//  Prayer Calendar
//
//  Created by Matt Lam on 11/17/23.
//
// Description: This is the form to edit an existing prayer request.

// PostFullView.swift

import SwiftUI

struct PostFullView: View {
    @Environment(UserProfileHolder.self) var userHolder
    @Environment(\.dismiss) var dismiss
    
    @State var postHelper = PostHelper()
    @State var postUpdates: [PostUpdate] = []
    @State var person: Person
    @State var newPost: Post
    @State var lineLimit: Int = 6
    @Binding var post: Post
    @Binding var navigationPath: NavigationPath
    
    @State private var showAddUpdateView: Bool = false
    @State private var originalPrivacy: String = ""
    @State private var expandUpdate: Bool = false
    @State private var isTruncated: Bool = false
    @State private var commentViewModel: CommentViewModel?
    @State private var showComments: Bool = true
    private let notificationHelper = NotificationHelper()
    
    init(person: Person, post: Binding<Post>, navigationPath: Binding<NavigationPath>) {
        _post = post
        self.person = person
        _newPost = State(initialValue: post.wrappedValue)
        _navigationPath = navigationPath
        ViewLogger.debug("PostFullView.init: Initializing with Post ID: \(post.wrappedValue.id)")
    }
    
    var body: some View {
        mainContent
        .navigationTitle("Post")
        .navigationBarTitleDisplayMode(.inline)
    }
    
    private var mainContent: some View {
        ScrollViewReader { scrollViewProxy in
            ScrollView {
                VStack {
                    postHeaderView()
                    if newPost.latestUpdateText != "" {
                        latestUpdateView()
                    }
                    postContentView()
                    Spacer(minLength: 20)
                    
                    commentsSectionView()
                }
                .padding(.horizontal, 20)
                .id("TextEditorBottom")
            }
            .onChange(of: commentViewModel?.scrollToEnd ?? false) {
                if commentViewModel?.scrollToEnd == true {
                    withAnimation {
                        scrollViewProxy.scrollTo("TextEditorBottom", anchor: .bottom)
                    }
                    commentViewModel?.scrollToEnd = false
                }
            }
        }
        .task {
            // Load the post first
            await loadPost()
            
            // Only initialize CommentViewModel if we have a valid post
            if commentViewModel == nil && !newPost.id.isEmpty {
                ViewLogger.debug("PostFullView.task: Initializing CommentViewModel - Post ID: \(newPost.id)")
                ViewLogger.debug("PostFullView.task: Initializing CommentViewModel - Person ID: \(userHolder.person.userID)")
                
                commentViewModel = CommentViewModel(
                    person: userHolder.person,
                    post: newPost
                )
                
                // Fetch initial comments after initialization
                ViewLogger.debug("PostFullView.task: Fetching initial comments")
                await commentViewModel?.fetchInitialComments()
            }
            
            await updateNotificationSeenIfNotificationCountExisted()
        }
        .refreshable { await refreshPost() }
        .scrollIndicators(.hidden)
        .scrollDismissesKeyboard(.immediately)
        .padding(.bottom, 15)
        .clipped()
    }
    
    private var formattedPostTitle: String {
        if !newPost.postTitle.isEmpty {
            if newPost.postType == "Prayer Request" {
                return "Prayer: \(newPost.postTitle)"
            } else if newPost.postType == "Praise" {
                return "Praise: \(newPost.postTitle)"
            } else {
                return "Note: \(newPost.postTitle)"
            }
        }
        return "Post"
    }
    
    // MARK: - Post Header View
    private func postHeaderView() -> some View {
        HStack {
            Button {
                navigationPath.append(person)
            } label: {
                ProfilePictureAvatar(firstName: newPost.firstName, lastName: newPost.lastName, imageSize: 50, fontSize: 20)
                    .buttonStyle(.plain)
                    .foregroundStyle(Color.primary)
            }
            .id(UUID())
            VStack(alignment: .leading) {
                Text("\(newPost.firstName.capitalized) \(newPost.lastName.capitalized)")
                    .font(.system(size: 18)).bold()
                Text(usernameDisplay()).font(.system(size: 14))
            }
            Spacer()
            HStack(alignment: .center) {
                if newPost.isPinned { Image(systemName: "pin.fill") }
                Privacy(rawValue: newPost.privacy)?.systemImage
                postOptionsMenu()
                    .highPriorityGesture(TapGesture())
            }
            .font(.system(size: 13))
        }
        .padding(.bottom, 10)
    }
    
    // MARK: - Latest Update View
    private func latestUpdateView() -> some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack {
                VStack(alignment: .leading) {
                    Text("**Latest \(newPost.latestUpdateType)**:")
                    Text(newPost.latestUpdateDatePosted.formatted(date: .abbreviated, time: .omitted))
                        .font(.system(size: 14))
                }
                Spacer()
                NavigationLink(destination: UpdateView(post: newPost, person: person)) {
                    seeAllUpdatesButton()
                }
                .id(UUID())
            }
            updateTextView()
            if isTruncated { expandButton() }
        }
        .padding(10)
        .background(RoundedRectangle(cornerRadius: 10).fill(Color.gray).opacity(0.06))
        .padding(.bottom, 8)
    }
    
    // MARK: - Post Content View
    private func postContentView() -> some View {
        VStack(alignment: .leading, spacing: 15) {
            Text(newPost.postTitle).font(.system(size: 18)).bold()
            Text(newPost.postType == "Prayer Request" ? "Prayer Request: \(Text(newPost.status.capitalized).bold())" : newPost.postType == "Praise" ? "Praise 🙌" : "Note 📝")
                .font(.system(size: 14))
            Divider()
            Text(newPost.postText)
                .font(.system(size: 16))
                .multilineTextAlignment(.leading)
            Text("\(postHelper.timeStringFull(for: newPost.date))")
                .font(.system(size: 14))
                .font(.caption)
                .foregroundColor(.secondary)
        }
    }
    
    // MARK: - Comment Section View
    private func commentsSectionView() -> some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack {
                Text("Comments")
                    .font(.system(size: 16))
                    .fontWeight(.medium)
                Button {
                    showComments.toggle()
                } label: {
                    Image(systemName: (showComments ? "chevron.up" : "chevron.down"))
                        .foregroundStyle(Color.primary)
                        .fontWeight(.medium)
                }
                Spacer()
            }
            
            if showComments, let viewModel = commentViewModel, !newPost.id.isEmpty {
                CommentsView(
                    post: newPost,
                    isInSheet: false,
                    viewModel: viewModel
                )
                .id("commentsSection")
            }
        }
    }
    
    // MARK: - Helper Views & Methods
    private func postOptionsMenu() -> some View {
        Menu {
            if person.userID == userHolder.person.userID {
                NavigationLink(destination: PostEditView(person: person, post: post)
                    .onDisappear {
                        Task {
                            await refreshPost()
                        }
                    }) {
                    Label("Edit Post", systemImage: "pencil")
                }
            }
            Button(action: togglePinPost) {
                Label(newPost.isPinned ? "Unpin prayer request" : "Pin to feed", 
                      systemImage: newPost.isPinned ? "pin.slash" : "pin.fill")
            }
        } label: {
            HStack(alignment: .center) {
                Label("", systemImage: "ellipsis")
                    .background {
                        Rectangle()
                            .fill(.clear)
                    }
                    .frame(maxHeight: .infinity)
                    .foregroundStyle(Color.primary)
            }
        }
    }
    
    private func seeAllUpdatesButton() -> some View {
        HStack {
            Text("see all updates").padding(.trailing, -3)
            Image(systemName: "chevron.right")
        }
        .font(.system(size: 14))
        .foregroundColor(.blue)
    }
    
    private func updateTextView() -> some View {
        VStack {
            Text(newPost.latestUpdateText)
                .lineLimit(expandUpdate ? nil : lineLimit)
                .background(
                    ViewThatFits(in: .vertical) {
                        Text(newPost.latestUpdateText).hidden()
                        Color.clear.onAppear { isTruncated = true }
                    }
                )
        }
        .font(.system(size: 16))
    }
    
    private func expandButton() -> some View {
        Button(action: { expandUpdate.toggle() }) {
            Text(expandUpdate ? "Show Less" : "Show More")
                .foregroundStyle(Color.blue)
                .font(.system(size: 14))
        }
    }
    
    private func usernameDisplay() -> String {
        "@\(post.username.capitalized)"
    }
    
    private func loadPost() async {
        do {
            ViewLogger.debug("PostFullView.loadPost: Loading post - Current ID: \(newPost.id)")
            newPost = try await PostOperationsService().getPost(prayerRequest: post, user: userHolder.person)
            ViewLogger.info("PostFullView.loadPost: Successfully loaded post - New ID: \(newPost.id)")
            post = newPost
        } catch {
            ViewLogger.error("PostFullView.loadPost failed: \(error.localizedDescription)")
        }
    }
    
    private func updateNotificationSeenIfNotificationCountExisted() async {
        if newPost.lastSeenNotificationCount > 0 {
            do {
                try await FeedService().updateLastSeenNotificationCount(post: post, person: userHolder.person)
            } catch {
                ViewLogger.error("PostFullView.updateNotificationSeen failed: \(error.localizedDescription)")
            }
        }
    }
    
    private func refreshPost() async {
        do {
            newPost = try await PostOperationsService().getPost(prayerRequest: newPost, user: userHolder.person)
            if !newPost.id.isEmpty {
                if commentViewModel == nil {
                    ViewLogger.debug("PostFullView.refreshPost: Creating CommentViewModel - Post ID: \(newPost.id)")
                    commentViewModel = CommentViewModel(
                        person: userHolder.person,
                        post: newPost
                    )
                } else {
                    ViewLogger.debug("PostFullView.refreshPost: Refreshing comments - Post ID: \(newPost.id)")
                    await commentViewModel?.fetchInitialComments()
                }
            }
            post = newPost
        } catch {
            ViewLogger.error("PostFullView.refreshPost failed: \(error.localizedDescription)")
        }
    }
    
    private func togglePinPost() {
        Task { @MainActor in
            do {
                newPost.isPinned.toggle()
                try await PostHelper().togglePinned(person: userHolder.person, post: newPost, toggle: newPost.isPinned)
            } catch {
                ViewLogger.error("PostFullView.togglePinPost failed: \(error.localizedDescription)")
            }
        }
    }
}
