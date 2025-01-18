//
//  SubmitPrayerRequestForm.swift
//  Prayer Calendar
//
//  Created by Matt Lam on 11/14/23.
//
// This is the form for a user to submit a new prayer request

import SwiftUI
import FirebaseFirestore

@MainActor
struct PostCreateView: View {
    @Environment(UserProfileHolder.self) var userHolder
    @Environment(FriendRequestListener.self) var friendRequestListener
    @Environment(\.colorScheme) var colorScheme
    @Environment(\.dismiss) var dismiss
    
    @State var person: Person
    @State var postType: Post.PostType? = .prayerRequest
    @State private var datePosted = Date()
    @State private var status: String = "Current"
    @State private var postText: String = ""
    @State private var postTitle: String = ""
    @State private var privacy: String = "private"
    @State private var isPresentingFriends: Bool = false
    @State private var isPinned: Bool = false

    @State private var isDraftSaved = false

    var friendService = FriendService()
    
    var body: some View {
        NavigationStack{
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
//                            Text("Select Type").tag(Post.PostType?.none) // Default empty option
                            ForEach(Post.PostType.allCases, id: \.self) { type in
                                Text(type.rawValue).tag(type)
                            }
                        }
                        ZStack(alignment: .topLeading) {
                            if postText.isEmpty {
                                HStack{
                                    if postType == .note {
                                        Text("Share what's on your mind. It can be a thought, an encouragement, or anything that God has placed on your heart.")
                                    } else if postType == .praise {
                                        Text("Write a praise report! What have seen God do in your life or in the lives of those around you?")
                                    } else {
                                        Text("Enter a prayer request. Consider writing it in the form of a prayer. Or, if you plan to share it with others, make sure you give enough detail so others can know what they can be praying for.")
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
                    Section {
                        isPinnedView()
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
                    postType: postType?.rawValue ?? "note",
                    friendsList: friendRequestListener.acceptedFriendRequests,
                    isPinned: isPinned)
                userHolder.refresh = true
                
                clearDraft()
                isDraftSaved = true

                // DispatchQueue ensures that dismiss happens on the main thread.
                DispatchQueue.main.async {
                    dismiss()
                }
            } catch {
                ViewLogger.error("PostCreateView.submitPost failed \(error)")
            }
        }
    }

    private func saveDraft() {
        if !postTitle.isEmpty || !postText.isEmpty {
            userHolder.draftPost = UserProfileHolder.DraftPost(
                title: postTitle,
                content: postText,
                postType: postType ?? .note,
                privacy: privacy
            )
        } else {
            ViewLogger.info("SubmitPostForm.saveDraft No content to save as draft")
        }
    }

    private func loadDraft() {
        if let draft = userHolder.draftPost {
            postTitle = draft.title
            postText = draft.content
            postType = draft.postType
            privacy = draft.privacy
        }
    }

    private func clearDraft() {
        userHolder.draftPost = nil
    }
    
    @ViewBuilder
    func friendsList() -> some View {
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
    
    private func isPinnedView() -> some View {
        HStack {
            Toggle(isOn: $isPinned){
                Text("Pin to Prayer List")
            }
        }
    }
}

//#Preview {
//    SubmitPostForm(person: Person(username: "lammylol"))
//        .environment(UserProfileHolder())
//}
