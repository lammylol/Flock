//
//  SubmitPrayerRequestForm.swift
//  Prayer Calendar
//
//  Created by Matt Lam on 11/14/23.
//
// This is the form for a user to submit a new prayer request

import SwiftUI
import FirebaseFirestore

struct SubmitPostForm: View {
    @Environment(UserProfileHolder.self) var userHolder
    @Environment(FriendRequestListener.self) var friendRequestListener
    @Environment(\.colorScheme) var colorScheme
    @Environment(\.dismiss) var dismiss
    
    @State var person: Person
    @State private var datePosted = Date()
    @State private var status: String = "Current"
    @State private var postText: String = ""
    @State private var postTitle: String = ""
    @State private var postType: String = "Default"
    @State private var privacy: String = "private"
    @State private var isPresentingFriends: Bool = false
    
    @State private var isDraftSaved = false

    var friendService = FriendService()
    
    var body: some View {
        NavigationView{
            ZStack {
                (colorScheme == .light ? Color(.systemGray6) : .clear)
                    .ignoresSafeArea()
                
                Form {
                    Section(/*header: Text("Share a Prayer Request")*/) {
                        ZStack(alignment: .topLeading) {
                            if postTitle.isEmpty {
                                Text("Enter Title")
                                    .offset(x: 0, y: 8)
                                    .foregroundStyle(Color.gray)
                            }
                            TextEditor(text: $postTitle)
                                .frame(minHeight: 38)
                                .offset(x: -5, y: -1)
                        }
                        .padding(.bottom, -4)
                        Picker("Type", selection: $postType) {
                            Text("Default (Post)").tag("Default")
                            Text("Praise").tag("Praise")
                            Text("Prayer Request").tag("Prayer Request")
                        }
                        ZStack(alignment: .topLeading) {
                            if postText.isEmpty {
                                HStack{
                                    if postType == "Default" {
                                        Text("Share what's on your mind. It can be a thought, an encouragement, or anything that God has placed on your heart.")
                                    } else if postType == "Praise" {
                                        Text("Share a praise report! What have seen God do in your life or in the lives of those around you?")
                                    } else {
                                        Text("Share a prayer request. Consider sharing your post in the form of a prayer so that readers can join with you in prayer as they read it.")
                                    }
                                }
                                .padding(.leading, 0)
                                .padding(.top, 8)
                                .foregroundStyle(Color.gray)
                            }
                            TextEditor(text: $postText)
                                .frame(height: 300)
                                .offset(x: -5)
                        }
                    }
                    Section {
                        HStack {
                            Text("Privacy")
                            Spacer()
                            PrivacyView(person: person, privacySetting: $privacy)
//                                .task {
//                                    if person.isPrivateFriend {
//                                        privacy = "private"
//                                    }
//                                }
                                .onChange(of: privacy, {
                                    if privacy == "public" {
                                        isPresentingFriends = true
                                    }
                                })
                        }
                    } footer: {
                        if privacy == "public" {
                            friendsList()
                                .padding(.top, 10)
                        }
                    }
                }
            }
            .toolbar {
                ToolbarItemGroup(placement: .topBarLeading) {
                    Button("Cancel") {
                        if !isDraftSaved {
                            saveDraft()
                            isDraftSaved = true
                        }
                        dismiss()
                    }
                }
                ToolbarItemGroup(placement: .topBarTrailing) {
                    Button(action: {submitPost()}) {
                        Text("Post")
                            .offset(x: -4)
                            .font(.system(size: 16))
                            .padding([.leading, .trailing], 10)
                            .bold()
                    }
                    .background(
                        RoundedRectangle(cornerRadius: 15)
                            .fill(.blue)
                    )
                    .foregroundStyle(.white)
                }
            }
            .navigationBarBackButtonHidden(true)
            .navigationTitle("Add Something...")
            .navigationBarTitleDisplayMode(.inline)
        }
        .onAppear {
            isDraftSaved = false
            loadDraft()
        }
        .onDisappear {
            if !isDraftSaved {
                saveDraft()
                isDraftSaved = true
            }
        }
    }
        
    func submitPost() {
        Task {
            do {
                try await PostOperationsService().createPost(
                    userID: userHolder.person.userID,
                    datePosted: Date(),
                    person: person,
                    postText: postText,
                    postTitle: postTitle,
                    privacy: privacy,
                    postType: postType,
                    friendsList: friendRequestListener.acceptedFriendRequests)
                userHolder.refresh = true
                print("Saved")
                
                clearDraft()
                isDraftSaved = true

                // DispatchQueue ensures that dismiss happens on the main thread.
                DispatchQueue.main.async {
                    dismiss()
                }
            } catch {
                print(error)
            }
        }
    }

    private func saveDraft() {
        if !postTitle.isEmpty || !postText.isEmpty {
            userHolder.draftPost = UserProfileHolder.DraftPost(
                title: postTitle,
                content: postText,
                selectedTags: [postType, privacy]
            )
            print("Draft saved")
        } else {
            print("No content to save as draft")
        }
    }

    private func loadDraft() {
        if let draft = userHolder.draftPost {
            postTitle = draft.title
            postText = draft.content
            if draft.selectedTags.count >= 2 {
                postType = draft.selectedTags[0]
                privacy = draft.selectedTags[1]
            }
            print("Draft loaded")
        }
    }

    private func clearDraft() {
        userHolder.draftPost = nil
        print("Draft cleared")
    }
    
//    func refreshFriends() {
//        Task {
//            do {
//                userHolder.friendsList = try await friendService.getFriendsList(userID: userHolder.person.userID).0
//                self.userHolder.friendsList = userHolder.friendsList
//            } catch {
//                print(error)
//            }
//        }
//    }
    
    @ViewBuilder
    func friendsList() -> some View {
//        let friendsList = userHolder.friendsList.map({
//            $0.firstName + " " + $0.lastName
//        }).joined(separator: ", ")
        ScrollView {
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
    }
}

//#Preview {
//    SubmitPostForm(person: Person(username: "lammylol"))
//        .environment(UserProfileHolder())
//}
