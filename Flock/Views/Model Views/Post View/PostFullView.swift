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
    @State var post: Post = Post.blank
    @Binding var originalPost: Post
    @State var showAddUpdateView: Bool = false
    @State private var originalPrivacy: String = ""
    @State private var expandUpdate: Bool = false
//    @State private var truncatedTextSize: CGFloat = .zero
//    @State private var expandTextSize: CGFloat = .zero
    @State private var isTruncated: Bool = false
    @State var lineLimit: Int = 6 // This is to set default setting for max lines shown, set as a var so a user can pass in .max if they are calling directly from the feed.
    
    @State private var commentViewModel = CommentViewModel()
    @State private var newCommentText = ""
    
    var body: some View {
        ScrollView {
            LazyVStack{
                HStack {
                    VStack() {
                        NavigationLink(destination: ProfileView(person: Person(userID: post.userID, username: post.username, firstName: post.firstName, lastName: post.lastName))) {
                            ProfilePictureAvatar(firstName: post.firstName, lastName: post.lastName, imageSize: 50, fontSize: 20)
                                .buttonStyle(.plain)
                                .foregroundStyle(Color.primary)
                        }
                        .id(UUID())
                    }
                    .padding(.trailing, 8)
                    
                    VStack() {
                        HStack {
                            Text(post.firstName.capitalized + " " + post.lastName.capitalized).font(.system(size: 18)).bold()
                            Spacer()
                        }
                        HStack() {
                            Text(usernameDisplay())
                            Spacer()
                        }
                    } // Name and Username
                    
                    Spacer()
                    
                    if post.isPinned == true {
                        Image(systemName: "pin.fill")
                    }
                    
                    Privacy(rawValue: post.privacy)?.systemImage
                    
                    Menu {
                        if person.userID == userHolder.person.userID {
                            NavigationLink(destination: PostEditView(person: person, post: post)){
                                Label("Edit Post", systemImage: "pencil")
                            }
                        }
                        Button {
                            self.pinPost()
                        } label: {
                            if post.isPinned == false {
                                Label("Pin to feed", systemImage: "pin.fill")
                            } else {
                                Label("Unpin prayer request", systemImage: "pin.slash")
                            }
                        }
                    } label: {
                        Label("", systemImage: "ellipsis")
                    }
                    .highPriorityGesture(TapGesture())
                }
                .font(.system(size: 13))
                .padding(.bottom, 10)
                
                // Latest Update Banner.
                if post.latestUpdateText != "" {
                    VStack (alignment: .leading) {
                        HStack {
                            VStack (alignment: .leading) {
                                Text("**Latest \(post.latestUpdateType)**:")
                                    .padding(.bottom, -4)
                                Text("\(post.latestUpdateDatePosted.formatted(date: .abbreviated, time: .omitted))")
                                    .font(.system(size: 14))
                            }
                            Spacer()
                            NavigationLink(destination: UpdateView(post: post, person: person)) {
                                VStack {
                                    HStack {
                                        Text("see all updates")
                                            .padding(.trailing, -3)
                                        Image(systemName: "chevron.right")
                                    }
                                    .font(.system(size: 14))
                                    .foregroundColor(.blue)
                                    Spacer()
                                }
                            }
                            .id(UUID())
                        } // Latest Update, Date, + See All Updates
                        
                        VStack {
                            Text("\(post.latestUpdateText)")
                                .lineLimit({
                                    if expandUpdate == false {
                                        lineLimit
                                    } else {
                                        .max
                                    }
                                }())
                                .background {
                                    ViewThatFits(in: .vertical) {
                                        Text("\(post.latestUpdateText)")
                                            .hidden()
                                        Color.clear
                                            .onAppear {
                                                isTruncated = true
                                            }
                                    }
                                }
                        }
                        .font(.system(size: 16))
                        .padding(.top, 7)
                        .padding(.bottom, 10)
                        .multilineTextAlignment(.leading)
                        
                        if isTruncated {
                            Button {
                                self.expandLines()
                            } label: {
                                Text(expandUpdate ? "Show Less" : "Show More")
                                    .italic()
                                    .foregroundStyle(Color.blue)
                                    .font(.system(size: 14))
                            }
                        } // This is to calculate if the text is truncated or not. Background must be the same, but w/o line limit.
                    }
                    .padding(.all, 10)
                    .background(
                        RoundedRectangle(cornerRadius: 10)
                            .fill(.gray)
                            .opacity(0.06)
                    )
                    .foregroundStyle(Color.primary)
                    .padding(.bottom, 8)
                }
                
                // Content of Post
                VStack(alignment: .leading) {
                    HStack {
                        if post.postType == "Prayer Request" {
                            Text("Prayer Request: ") + Text(post.status.capitalized).bold()
                        } else if post.postType == "Praise" {
                            Text("Praise 🙌")
                        } else {
                            Text("Post 📝")
                        }
                    }
                    .font(.system(size: 16))
                    Divider()
                        .padding(.top, 5)
                        .padding(.bottom, 5)
                    HStack {
                        if post.postTitle != "" {
                            Text(post.postTitle)
                                .font(.system(size: 18))
                                .bold()
                                .multilineTextAlignment(.leading)
                                .padding(.top, 7)
                            Spacer()
                        }
                    }
                    Text(post.date, style: .date)
                        .font(.system(size: 14))
                    Text(post.postText)
                        .font(.system(size: 16))
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .multilineTextAlignment(/*@START_MENU_TOKEN@*/.leading/*@END_MENU_TOKEN@*/)
                        .padding(.top, 7)
                }
                VStack(alignment: .leading) {
                    Text("Comments")
                        .font(.headline)
                        .padding(.top)

                    if commentViewModel.isLoading {
                        ProgressView()
                    } else if commentViewModel.comments.isEmpty {
                        Text("No comments yet.")
                            .foregroundColor(.secondary)
                    } else {
                        ForEach(commentViewModel.comments) { comment in
                            CommentRow(comment: comment)
                        }
                    }

                    HStack {
                        TextField("Add a comment", text: $newCommentText)
                        Button("Post") {
                            commentViewModel.addComment(to: post.id, text: newCommentText, person: userHolder.person)
                            newCommentText = ""
                        }
                        .disabled(newCommentText.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty)
                    }
                    .padding(.top)
                }
                .padding()
            }
        .onAppear {
            commentViewModel.fetchComments(for: post.id)
        }
        Spacer()
    }
        .task {
            do {
                self.post = try await PostOperationsService().getPost(prayerRequest: originalPost)
                self.originalPost = self.post
                print("isPinned: " + post.isPinned.description)
                originalPrivacy = post.privacy // for catching public to private.
            } catch {
                // DispatchQueue ensures that dismiss happens on the main thread.
                DispatchQueue.main.async {
                    dismiss()
                }
            }
        }
        .refreshable(action: {
            Task {
                self.post = try await PostOperationsService().getPost(prayerRequest: post)
                self.originalPost = self.post
            }
        })
        .scrollIndicators(.hidden)
        .padding([.leading, .trailing], 20)
        .padding([.top, .bottom], 15)
        .navigationTitle("Post")
        .navigationBarTitleDisplayMode(.inline)
        .frame(maxWidth: /*@START_MENU_TOKEN@*/.infinity/*@END_MENU_TOKEN@*/, maxHeight: .infinity)
    }
    
    func pinPost(){
        Task {
            do {
                var isPinnedToggle = post.isPinned
                isPinnedToggle.toggle()
                self.post.isPinned = isPinnedToggle
                
                try await PostHelper().togglePinned(person: userHolder.person, post: post, toggle: isPinnedToggle)
                //        userHolder.refresh = true
            } catch {
                print(error)
            }
        }
    }
    
    func usernameDisplay() -> String {
        if person.username == "" {
            return "private profile"
        } else {
            return "@\(person.username.capitalized)"
        }
    }
    
    func expandLines() {
        expandUpdate.toggle()
    }
}
