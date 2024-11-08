//
//  PrayerRequestRows.swift
//  Prayer Calendar
//
//  Created by Matt Lam on 11/10/23.
//
// Description: This captures the layout of what each row in the prayer request list looks like.

import SwiftUI

struct PostRow: View {
    @Environment(UserProfileHolder.self) var userHolder
    @Environment(\.colorScheme) private var scheme

    @State var viewModel: FeedViewModel
    @Binding var post: Post
    @State var postHelper = PostHelper()

    // For Update
    @State private var expandUpdate: Bool = false
    @State private var isTruncated: Bool = false
    
    // For Main Text
    @State private var postExpandUpdate: Bool = false
    @State private var postIsTruncated: Bool = false
    @State private var showProfileView: Bool = false
//
//    init(viewModel: FeedViewModel, post: Binding<Post>) {
//        self.viewModel = viewModel
//        _post = post
//    }
    
    var body: some View {
            LazyVStack {
                HStack {
                    VStack() {
                        NavigationLink(destination: ProfileView(person: post.person)) {
                            ProfilePictureAvatar(firstName: post.firstName, lastName: post.lastName, imageSize: 50, fontSize: 20)
                                .buttonStyle(.plain)
                                .foregroundStyle(Color.primary)
                        }
                        .id(UUID())
                    }
                    .padding(.trailing, 8)

                    VStack(alignment: .leading) {
                        HStack {
                            Text(post.firstName.capitalized + " " + post.lastName.capitalized)
                                .font(.system(size: 18))
                                .bold()
                            Spacer()
                            if post.isPinned == true {
                                Image(systemName: "pin.fill")
                            }
                            Privacy(rawValue: post.privacy)?.systemImage
                            Menu {
                                if post.userID == userHolder.person.userID {
                                    NavigationLink(destination: PostEditView(post: post)){
                                        Label("Edit Post", systemImage: "pencil")
                                    } // can only edit if you are the owner of the post.
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
                                .highPriorityGesture(TapGesture())
                            } label: {
                                Label("", systemImage: "ellipsis")
                            }
                        }
                        .font(.system(size: 13))
                        .padding(.bottom, 2)
                        
                        HStack {
                            if post.postType == "Prayer Request" {
                                Text("Prayer Request: ").font(.system(size: 12)) + Text(post.status.capitalized).font(.system(size: 12)).bold()
                            } else if post.postType == "Praise" {
                                Text("Praise 🙌").font(.system(size: 12))
                            } else {
                                Text("Note 📝").font(.system(size: 12))
                            }
                            Spacer()
                        }
                    }
                }
                
                VStack (alignment: .leading) {
                    Group {
                        // Latest Update Banner.
                        if post.latestUpdateText != "" {
                            VStack (alignment: .leading, spacing: 10) {
                                HStack {
                                    Text("**Latest \(post.latestUpdateType)**:")
                                        .padding(.bottom, -4)
                                    Spacer()
                                    Text("\(post.latestUpdateDatePosted.formatted(date: .abbreviated, time: .omitted))")
                                        .font(.system(size: 14))
                                } // Latest Update, Date, + See All Updates
                                
                                VStack {
                                    Text("\(post.latestUpdateText)")
                                        .lineLimit({
                                            if expandUpdate == false {
                                                6
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
                                .multilineTextAlignment(.leading)
                                
                                if isTruncated {
                                    NavigationLink(destination: PostFullView(post: $post)) {
                                        Text(expandUpdate ? "Show Less" : "Show More")
                                            .foregroundStyle(Color.blue)
                                            .font(.system(size: 14))
                                    }
                                } // This is to calculate if the text is truncated or not. Background must be the same, but w/o line limit.
                                
                            }
                            .padding(.all, 10)
                            .background {
                                RoundedRectangle(cornerRadius: 10).fill(Color(UIColor.systemGray6))
                            }
                            .foregroundStyle(Color.primary)
                            .padding(.vertical, 7)// Group for latest banner with truncation methodology.
                        }
                    }
                    
                    VStack (alignment: .leading) {
                        HStack {
                            if post.postTitle != "" {
                                Text(post.postTitle)
                                    .font(.system(size: 18))
                                    .bold()
                                    .multilineTextAlignment(.leading)
                                Spacer()
                            }
                        }
                        .padding(.top, 7)
                        
                        VStack {
                            Text("\(post.postText)")
                                .lineLimit({
                                    if postExpandUpdate == false {
                                        6
                                    } else {
                                        .max
                                    }
                                }())
                                .background {
                                    ViewThatFits(in: .vertical) {
                                        Text("\(post.postText)")
                                            .hidden()
                                        Color.clear
                                            .onAppear {
                                                postIsTruncated = true
                                            }
                                    }
                                }
                        }
                        .font(.system(size: 16))
                        .padding(.top, 7)
                        .padding(.bottom, 10)
                        .multilineTextAlignment(.leading)
                        
                        if postIsTruncated {
                            Text(postExpandUpdate ? "Show Less" : "Show More")
                                .foregroundStyle(Color.blue)
                                .font(.system(size: 14))
                            // technically no need for navigation link since you just click to go to the next page anyways.
                        } // This is to calculate if the text is truncated or not. Background must be the same, but w/o line limit.
                        
                        //comments
                        HStack {
                            Text(postHelper.relativeTimeStringFull(for: post.date))
                                .font(.system(size: 12))
                                .font(.caption)
                                .foregroundColor(.secondary)
                                .padding(.top, 7)
                            Spacer()
                            HStack {
                                Image(systemName: "bubble.left")
                                Text("Comments")
                            }
                            .font(.footnote)
                            .padding(6)
                            .background(Color(UIColor.systemGray6))
                            .cornerRadius(8)
                            .padding(.top, 7)
                        }
                    }
                }
            }
            .foregroundStyle(Color.primary)
            .padding([.top, .bottom], 15)
            .frame(maxWidth: .infinity, maxHeight: .infinity)
    }
    
    func pinPost(){
        Task {
            do {
                post.isPinned.toggle()
                try await PostHelper().togglePinned(person: userHolder.person, post: post, toggle: post.isPinned)
            } catch {
                ModelLogger.error("PostRow.pinPost \(error)")
            }
        }
    }
    
    func removeFromFeed(){
        //removeFeed
    }
    
    func expandLines() {
        expandUpdate.toggle()
    }
    
    func postExpandLines() {
        postExpandUpdate.toggle()
    }
}

struct LatestUpdate: View {
    var post: Post
    
    var body: some View {
        VStack(alignment: .leading) {
            Text("\(post.latestUpdateType): \(post.latestUpdateText)")
                .multilineTextAlignment(.leading)
                .frame(maxWidth: .infinity, alignment: .leading)
                .font(.system(size: 14))
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }
}
