//
//  EditPrayerRequestForm.swift
//  Prayer Calendar
//
//  Created by Matt Lam on 11/17/23.
//
// Description: This is the form to edit an existing prayer request.

import SwiftUI

struct PostFullView: View {
    @Environment(UserProfileHolder.self) var userHolder
    @Environment(\.dismiss) var dismiss
    
    @State var postUpdates: [PostUpdate] = []
    @State var person: Person
    @State var post: Post = Post()
    @State var lineLimit: Int = 6
    @Binding var originalPost: Post
    @State var showAddUpdateView: Bool = false
    
    @State private var originalPrivacy: String = ""
    @State private var expandUpdate: Bool = false
    @State private var isTruncated: Bool = false
    
    var body: some View {
        NavigationView {
            ScrollView {
                LazyVStack {
                    postHeaderView()
                    if post.latestUpdateText != "" {
                        latestUpdateView()
                    }
                    postContentView()
                    Spacer()
                }
            }
            .task{ loadPost() }
            .refreshable(action: refreshPost )
            .scrollIndicators(.hidden)
            .padding(.horizontal, 20)
            .padding(.vertical, 15)
        }
        .navigationTitle("Post")
        .navigationBarTitleDisplayMode(.inline)
    }
    
    // MARK: - Post Header View
    private func postHeaderView() -> some View {
        HStack {
            NavigationLink(destination: ProfileView(person: person)) {
                ProfilePictureAvatar(firstName: post.firstName, lastName: post.lastName, imageSize: 50, fontSize: 20)
                    .buttonStyle(.plain)
                    .foregroundStyle(Color.primary)
            }
            .id(UUID())
            VStack(alignment: .leading) {
                Text("\(post.firstName.capitalized) \(post.lastName.capitalized)")
                    .font(.system(size: 18)).bold()
                Text(usernameDisplay()).font(.system(size: 14))
            }
            Spacer()
            HStack {
                if post.isPinned { Image(systemName: "pin.fill") }
                Privacy(rawValue: post.privacy)?.systemImage
                postOptionsMenu()
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
                    Text("**Latest \(post.latestUpdateType)**:")
                    Text(post.latestUpdateDatePosted.formatted(date: .abbreviated, time: .omitted))
                        .font(.system(size: 14))
                }
                Spacer()
                NavigationLink(destination: UpdateView(post: post, person: person)) {
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
        VStack(alignment: .leading) {
            HStack {
                Text(post.postType == "Prayer Request" ? "Prayer Request: \(Text(post.status.capitalized).bold())" : post.postType == "Praise" ? "Praise 🙌" : "Post 📝")
            }
            .font(.system(size: 16))
            Divider().padding(.vertical, 5)
            Text(post.postTitle).font(.system(size: 18)).bold().padding(.top, 7)
            Text(post.date, style: .date).font(.system(size: 14))
            Text(post.postText)
                .font(.system(size: 16))
                .multilineTextAlignment(.leading)
                .padding(.top, 7)
        }
    }
    
    // MARK: - Helper Views & Methods
    private func postOptionsMenu() -> some View {
        Menu {
            if person.userID == userHolder.person.userID {
                NavigationLink(destination: PostEditView(person: person, post: post)
                    .onDisappear {
                        refreshPost()
                }) {
                    Label("Edit Post", systemImage: "pencil")
                }
            }
            Button(action: togglePinPost) {
                Label(post.isPinned ? "Unpin prayer request" : "Pin to feed", systemImage: post.isPinned ? "pin.slash" : "pin.fill")
            }
        } label: {
            Label("", systemImage: "ellipsis")
        }
        .highPriorityGesture(TapGesture())
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
        Text(post.latestUpdateText)
            .lineLimit(expandUpdate ? nil : lineLimit)
            .background(
                ViewThatFits(in: .vertical) {
                    Text(post.latestUpdateText).hidden()
                    Color.clear.onAppear { isTruncated = true }
                }
            )
    }
    
    private func expandButton() -> some View {
        Button(action: { expandUpdate.toggle() }) {
            Text(expandUpdate ? "Show Less" : "Show More")
                .foregroundStyle(Color.blue)
                .font(.system(size: 14))
        }
    }
    
    private func usernameDisplay() -> String {
        person.username.isEmpty ? "private profile" : "@\(person.username.capitalized)"
    }
    
    private func loadPost() {
        post = originalPost
    }
    
    private func refreshPost() {
        Task {
            post = try await PostOperationsService().getPost(prayerRequest: post)
            originalPost = post
        }
    }
    
    private func togglePinPost() {
        Task {
            do {
                post.isPinned.toggle()
                try await PostHelper().togglePinned(person: userHolder.person, post: post, toggle: post.isPinned)
            } catch {
                ViewLogger.error("PostFullView.pinPost \(error)")
            }
        }
    }
}