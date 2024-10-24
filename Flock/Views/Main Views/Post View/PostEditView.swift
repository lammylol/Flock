//
//  PostEditView.swift
//  Prayer Calendar
//
//  Created by Matt Lam on 6/24/24.
//

import SwiftUI

struct PostEditView: View {
    @Environment(UserProfileHolder.self) var userHolder
    @Environment(FriendRequestListener.self) var friendRequestListener
    @Environment(\.dismiss) var dismiss
    @Environment(\.colorScheme) var colorScheme
    
    @State var prayerRequestUpdates: [PostUpdate] = []
    @State var person: Person
    @State var post: Post
    @State var showAddUpdateView = false
    @State private var originalPrivacy = ""
    @State private var isPresentingConfirm = false
    
    var body: some View {
        NavigationView {
            ZStack {
                (colorScheme == .dark ? Color.black : Color(.systemGray6))
                    .ignoresSafeArea()
                
                Form {
                    Section {
                        isPinnedView()
                    }
                    
                    Section(header: Text("Title")) {
                        TextField("Title", text: $post.postTitle)
                        Picker("Type", selection: $post.postType) {
                            ForEach(Post.PostType.allCases, id: \.self) { type in
                                Text(type.rawValue).tag(type.rawValue)
                            }
                        }
                        if post.postType == "Prayer Request" {
                            Picker("Status", selection: $post.status) {
                                Text("Current").tag("Current")
                                Text("Answered").tag("Answered")
                                Text("No Longer Needed").tag("No Longer Needed")
                            }
                        }
                        HStack {
                            Text("Privacy")
                            Spacer()
                            PrivacyView(person: person, privacySetting: $post.privacy)
                        }
                    }
                    
                    Section(header: Text("Edit Post")) {
                        ZStack (alignment: .topLeading) {
                            if post.postText.isEmpty {
                                Text("Enter text")
                                    .padding(.top, 8)
                                    .foregroundStyle(Color.gray)
                            }
                            TextEditor(text: $post.postText)
                                .offset(x: -3, y: 2)
                            Text(post.postText)
                                .hidden() //this is a swift workaround to dynamically expand textEditor.
                                .frame(maxWidth: .infinity, maxHeight: .infinity)
                                .padding(.all, 8)
                        }
                    }
                    
                    ForEach(prayerRequestUpdates) { update in
                        Section(header: Text("\(update.updateType): \(update.datePosted, style: .date)")) {
                            NavigationLink(destination: EditPrayerUpdate(person: person, prayerRequest: post, prayerRequestUpdates: prayerRequestUpdates, update: update)) {
                                Text(update.prayerUpdateText)
                            }
                        }
                    }
                    
                    Section {
                        Button("Add Update") {
                            showAddUpdateView.toggle()
                        }
                        Button("Delete Post", role: .destructive) {
                            isPresentingConfirm = true
                        }
                        .confirmationDialog("Are you sure?",
                                            isPresented: $isPresentingConfirm) {
                            Button("Delete Post", role: .destructive) {
                                deletePost()
                            }
                        } message: {
                            Text("This post and all its updates will be permanently deleted.")
                        }
                    }
                }
                .clipped()
            }
        }
        .task { await loadPostAndUpdates() }
        .sheet(isPresented: $showAddUpdateView, onDismiss: {
            Task { await refreshUpdates() }
        }) {
            AddPrayerUpdateView(person: person, prayerRequest: post)
        }
        .navigationTitle("Edit Post")
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItemGroup(placement: .topBarTrailing) {
                Button(action: savePost) {
                    tagModelView(textLabel: "Save", textSize: 14, foregroundColor: .white, backgroundColor: .blue, cornerRadius: 15)
                }
            }
        }
    }
    
    func loadPostAndUpdates() async {
        do {
            post = try await PostOperationsService().getPost(prayerRequest: post)
            prayerRequestUpdates = try await PostUpdateHelper().getPrayerRequestUpdates(prayerRequest: post, person: person)
            originalPrivacy = post.privacy
        } catch {
            ViewLogger.error("Error retrieving post or updates: \(error)")
        }
    }
    
    func refreshUpdates() async {
        do {
            prayerRequestUpdates = try await PostUpdateHelper().getPrayerRequestUpdates(prayerRequest: post, person: person)
            post = try await PostOperationsService().getPost(prayerRequest: post)
        } catch {
            ViewLogger.error("Error refreshing updates: \(error)")
        }
    }
    
    func savePost() {
        Task {
            do {
                if originalPrivacy != "private" && post.privacy == "private" {
                    try await FeedService().publicToPrivate(post: post, friendsList: friendRequestListener.acceptedFriendRequests)
                }
                try await PostOperationsService().editPost(post: post, person: person, friendsList: friendRequestListener.acceptedFriendRequests)
                
                DispatchQueue.main.async {
                    dismiss()
                }
            } catch {
                ViewLogger.error("Error saving post: \(error)")
            }
        }
    }
    
    func deletePost() {
        Task {
            do {
                try await PostOperationsService().deletePost(post: post, person: person, friendsList: friendRequestListener.acceptedFriendRequests)
                userHolder.refresh = true
                
                DispatchQueue.main.async {
                    dismiss()
                }
            } catch {
                ViewLogger.error("Error deleting post: \(error)")
            }
        }
    }
    
    private func isPinnedView() -> some View {
        HStack {
            Toggle(isOn: $post.isPinned){
                Text("Pin to Prayer List")
            }
        }
    }
}

//#Preview {
//    PostEditView()
//}
