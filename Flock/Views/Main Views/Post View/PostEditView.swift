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
    
    var body: some View {
        NavigationView {
            ZStack {
                (colorScheme == .dark ? Color.black : Color(.systemGray6))
                    .ignoresSafeArea()
                
                Form {
                    Section(header: Text("Title")) {
                        TextField("Title", text: $post.postTitle)
                        Picker("Type", selection: $post.postType) {
                            Text("Default").tag("Default")
                            Text("Praise").tag("Praise")
                            Text("Prayer Request").tag("Prayer Request")
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
                                .offset(y: 2)
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
                        Button("Add Update or Testimony") {
                            showAddUpdateView.toggle()
                        }
                        Button("Delete Post", role: .destructive) {
                            deletePost()
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
                    tagModelView(textLabel: "Save", textSize: 14, foregroundColor: .white, backgroundColor: .blue)
                }
//                    .font(.system(size: 14).bold())
//                    .foregroundColor(.white)
//                    .padding(5)
//                    .background(RoundedRectangle(cornerRadius: 15).fill(Color.blue))
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
                dismiss()
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
                dismiss()
            } catch {
                ViewLogger.error("Error deleting post: \(error)")
            }
        }
    }
}
//
//struct PostEditView: View {
//    @Environment(UserProfileHolder.self) var userHolder
//    @Environment(FriendRequestListener.self) var friendRequestListener
//    @Environment(\.dismiss) var dismiss
//    @Environment(\.colorScheme) var colorScheme
//    
//    @State var prayerRequestUpdates: [PostUpdate] = []
//    @State var person: Person
//    @State var post: Post
//    @State var showAddUpdateView: Bool = false
//    @State private var originalPrivacy: String = ""
//    @State private var expandUpdate: Bool = false
//    @State private var expandTextSize: CGFloat = .zero
//    @State private var isTruncated: Bool = false
//    
//    var body: some View {
//            NavigationView {
//                ZStack {
//                    (colorScheme == .dark ? Color.black : Color(.systemGray6))
//                        .ignoresSafeArea()//background
//                    
//                    Form {
//                        Section(header: Text("Title")) {
//                            ZStack(alignment: .topLeading) {
//                                if post.postTitle.isEmpty {
//                                    Text("Title")
//                                        .padding(.top, 8)
//                                        .foregroundStyle(Color.gray)
//                                }
//                                Text(post.postTitle)
//                                    .foregroundStyle(Color.clear)//this is a swift workaround to dynamically expand textEditor.
//                                TextEditor(text: $post.postTitle)
//                                    .offset(x: -5, y: -1)
//                            }
//                            .padding(.bottom, -4)
//                            
//                            Picker("Type", selection: $post.postType) {
//                                Text("Default (Post)").tag("Default")
//                                Text("Praise").tag("Praise")
//                                Text("Prayer Request").tag("Prayer Request")
//                            }
//                            if post.postType == "Prayer Request" {
//                                Picker("Status", selection: $post.status) {
//                                    Text("Current").tag("Current")
//                                    Text("Answered").tag("Answered")
//                                    Text("No Longer Needed").tag("No Longer Needed")
//                                }
//                            }
//                            HStack {
//                                Text("Privacy")
//                                Spacer()
//                                PrivacyView(person: person, privacySetting: $post.privacy)
//                            }
//                        }
//                        Section(header: Text("Edit Post")) {
//                            ZStack (alignment: .topLeading) {
//                                if post.postText.isEmpty {
//                                    Text("Enter text")
//                                        .padding(.top, 8)
//                                        .foregroundStyle(Color.gray)
//                                }
//                                TextEditor(text: $post.postText)
//                                    .offset(y: 2)
//                                Text(post.postText)
//                                    .hidden() //this is a swift workaround to dynamically expand textEditor.
//                                    .frame(maxWidth: .infinity, maxHeight: .infinity)
//                                    .padding(.all, 8)
//                            }
//                        }
//                        if prayerRequestUpdates.count > 0 {
//                            ForEach(prayerRequestUpdates) { update in
//                                Section(header: Text("\(update.updateType): \(update.datePosted, style: .date)")) {
//                                    VStack(alignment: .leading){
//                                        NavigationLink(destination: EditPrayerUpdate(person: person, prayerRequest: post, prayerRequestUpdates: prayerRequestUpdates, update: update)) {
//                                            Text(update.prayerUpdateText)
//                                        }
//                                    }
//                                }
//                            }
//                        }
//                        Section {
//                            Button(action: {
//                                showAddUpdateView.toggle()
//                            }) {Text("Add Update or Testimony")
//                                //                                .font(.system(size: 16))
//                                    .foregroundColor(.blue)
//                                    .frame(maxWidth: .infinity, alignment: .center)
//                            }
//                        }
//                        Section {
//                            Button(action: {
//                                deletePost()
//                            }) {Text("Delete Post")
//                                //                                .font(.system(size: 16))
//                                    .foregroundColor(.red)
//                                    .frame(maxWidth: .infinity, alignment: .center)
//                            }
//                        }
//                    }
//                }
//            }
//            .task {
//                do {
//                    self.post = try await PostOperationsService().getPost(prayerRequest: post)
//                    self.post = post
//                    prayerRequestUpdates = try await PostUpdateHelper().getPrayerRequestUpdates(prayerRequest: post, person: person)
//                    originalPrivacy = post.privacy // for catching public to private.
//                } catch PrayerRequestRetrievalError.noPrayerRequestID {
//                    ViewLogger.error("PostEditView missing prayer request ID for update.")
//                } catch {
//                    ViewLogger.error("PostEditView error retrieving \(error)")
//                }
//            }
//            .sheet(isPresented: $showAddUpdateView, onDismiss: {
//                Task {
//                    do {
//                        prayerRequestUpdates = try await PostUpdateHelper().getPrayerRequestUpdates(prayerRequest: post, person: person)
//                        post = try await PostOperationsService().getPost(prayerRequest: post)
//                    } catch {
//                        ViewLogger.error("PostEditView error retrieving updates \(error)")
//                    }
//                }
//            }) {
//                AddPrayerUpdateView(person: person, prayerRequest: post)
//            }
//            .navigationTitle("Edit Post")
//            .navigationBarTitleDisplayMode(.inline)
//            .toolbar {
//                ToolbarItemGroup(placement: .topBarTrailing) {
//                    Button(action: {
//                        updatePost(post: post)
//                    }) {
//                        Text("Save")
//                            .offset(x: -4)
//                            .font(.system(size: 14))
//                            .padding([.leading, .trailing], 5)
//                            .bold()
//                            .foregroundStyle(.white)
//                    }
//                    .background(
//                        RoundedRectangle(cornerRadius: 15)
//                            .fill(.blue)
//                    )
//                }
//            }
//    }
//    
//    func updatePost(post: Post) {
//        Task {
//            do {
//                let newPrivacy = post.privacy
//                if originalPrivacy != "private" && newPrivacy == "private" {
//                    try await FeedService().publicToPrivate(post: post, friendsList: friendRequestListener.acceptedFriendRequests)
//                } // if the privacy has changed from public to private, delete it from friends' feeds.
//                
//                // Function to catch if privacy was changed from public to private.
//                try await PostOperationsService().editPost(post: post, person: person, friendsList: friendRequestListener.acceptedFriendRequests) // edit prayer request in firebase
//                
//                // DispatchQueue ensures that dismiss happens on the main thread.
//                DispatchQueue.main.async {
//                    dismiss()
//                }
//            } catch {
//                ViewLogger.error("PostEditView.updatePost \(error)")
//            }
//        }
//    }
//    
//    func deletePost() {
//        Task {
//            do {
//                try await PostOperationsService().deletePost(post: post, person: person, friendsList: friendRequestListener.acceptedFriendRequests)
//                userHolder.refresh = true
//                
//                // DispatchQueue ensures that dismiss happens on the main thread.
//                DispatchQueue.main.async {
//                    dismiss()
//                }
//            } catch {
//                ViewLogger.error("PostEditView.deletePost \(error)")
//            }
//        }
//    }
//}

//#Preview {
//    PostEditView()
//}
