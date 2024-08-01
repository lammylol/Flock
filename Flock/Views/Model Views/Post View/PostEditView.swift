//
//  PostEditView.swift
//  Prayer Calendar
//
//  Created by Matt Lam on 6/24/24.
//

import SwiftUI

struct PostEditView: View {
    @Environment(UserProfileHolder.self) var userHolder
    @Environment(\.dismiss) var dismiss
    
    @State var prayerRequestUpdates: [PostUpdate] = []
    var person: Person
    @State var post: Post
    @State var showAddUpdateView: Bool = false
    @State private var originalPrivacy: String = ""
    @State private var expandUpdate: Bool = false
    @State private var expandTextSize: CGFloat = .zero
    @State private var isTruncated: Bool = false
    
    var body: some View {
        NavigationStack {
            Form {
                Section(header: Text("Title")) {
                    ZStack(alignment: .topLeading) {
                        if post.postTitle.isEmpty {
                            Text("Title")
                                .padding(.top, 8)
                                .foregroundStyle(Color.gray)
                        }
                        Text(post.postTitle)
                            .foregroundStyle(Color.clear)//this is a swift workaround to dynamically expand textEditor.
                        TextEditor(text: $post.postTitle)
                            .offset(x: -5, y: -1)
                    }
                    .padding(.bottom, -4)
                    
                    Picker("Type", selection: $post.postType) {
                        Text("Default (Post)").tag("Default")
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
                if prayerRequestUpdates.count > 0 {
                    ForEach(prayerRequestUpdates) { update in
                        Section(header: Text("\(update.updateType): \(update.datePosted, style: .date)")) {
                            VStack(alignment: .leading){
                                NavigationLink(destination: EditPrayerUpdate(person: person, prayerRequest: post, prayerRequestUpdates: prayerRequestUpdates, update: update)) {
                                    Text(update.prayerUpdateText)
                                }
                            }
                        }
                    }
                }
                Section {
                    Button(action: {
                        showAddUpdateView.toggle()
                    }) {Text("Add Update or Testimony")
                        //                                .font(.system(size: 16))
                            .foregroundColor(.blue)
                            .frame(maxWidth: .infinity, alignment: .center)
                    }
                }
                Section {
                    Button(action: {
                        deletePost()
                    }) {Text("Delete Post")
                        //                                .font(.system(size: 16))
                            .foregroundColor(.red)
                            .frame(maxWidth: .infinity, alignment: .center)
                    }
                }
            }
            .task {
                do {
                    self.post = try await PostOperationsService().getPost(prayerRequest: post)
                    self.post = post
                    prayerRequestUpdates = try await PostUpdateHelper().getPrayerRequestUpdates(prayerRequest: post, person: person)
                    print("isPinned: " + post.isPinned.description)
                    originalPrivacy = post.privacy // for catching public to private.
                } catch PrayerRequestRetrievalError.noPrayerRequestID {
                    print("missing prayer request ID for update.")
                } catch {
                    print("error retrieving")
                }
            }
            .sheet(isPresented: $showAddUpdateView, onDismiss: {
                Task {
                    do {
                        prayerRequestUpdates = try await PostUpdateHelper().getPrayerRequestUpdates(prayerRequest: post, person: person)
                        post = try await PostOperationsService().getPost(prayerRequest: post)
                    } catch {
                        print("error retrieving updates.")
                    }
                }
            }) {
                AddPrayerUpdateView(person: person, prayerRequest: post)
            }
            .toolbar {
                ToolbarItemGroup(placement: .topBarTrailing) {
                    Button(action: {
                        updatePost(post: post)
                    }) {
                        Text("Save")
                            .offset(x: -4)
                            .font(.system(size: 14))
                            .padding([.leading, .trailing], 5)
                            .bold()
                            .foregroundStyle(.white)
                    }
                    .background(
                        RoundedRectangle(cornerRadius: 15)
                            .fill(.blue)
                    )
                }
            }
//            .toolbarBackground(Color.clear, for: .tabBar)
        }
        .navigationTitle("Edit Post")
        .navigationBarTitleDisplayMode(.inline)
    }
    
    func updatePost(post: Post) {
        Task {
            do {
                let newPrivacy = post.privacy
                if originalPrivacy != "private" && newPrivacy == "private" {
                    try await PostHelper().publicToPrivate(post: post, friendsList: userHolder.friendsList)
                } // if the privacy has changed from public to private, delete it from friends' feeds.
                
                // Function to catch if privacy was changed from public to private.
                try await PostHelper().editPost(post: post, person: person, friendsList: userHolder.friendsList) // edit prayer request in firebase
                
                print("Saved")
                
                // DispatchQueue ensures that dismiss happens on the main thread.
                DispatchQueue.main.async {
                    dismiss()
                }
            } catch {
                print(error)
            }
        }
    }
    
    func deletePost() {
        Task {
            do {
                try await PostHelper().deletePost(post: post, person: person, friendsList: userHolder.friendsList)
                userHolder.refresh = true
                
                print("Deleted")
                
                // DispatchQueue ensures that dismiss happens on the main thread.
                DispatchQueue.main.async {
                    dismiss()
                }
            } catch {
                print(error)
            }
        }
    }
}

//#Preview {
//    PostEditView()
//}
