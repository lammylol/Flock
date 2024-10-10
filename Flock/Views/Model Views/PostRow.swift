//
//  PrayerRequestRows.swift
//  Prayer Calendar
//
//  Created by Matt Lam on 11/10/23.
//
// Description: This captures the layout of what each row in the prayer request list looks like.

import SwiftUI

struct PostRow: View {
    @State var viewModel: FeedViewModel
    @Environment(\.colorScheme) private var scheme
    @Binding var post: Post
    @State var person: Person = Person()
    @Environment(UserProfileHolder.self) var userHolder
    
    // For Update
    @State private var expandUpdate: Bool = false
    @State private var isTruncated: Bool = false
    
    // For Main Text
    @State private var postExpandUpdate: Bool = false
    @State private var postIsTruncated: Bool = false

    @StateObject private var commentViewModel = CommentViewModel()
    @State private var showComments = false
    
    var body: some View {
        NavigationLink(destination: PostFullView(person: Person(userID: post.userID, username: post.username, firstName: post.firstName, lastName: post.lastName), originalPost: $post)) {
            LazyVStack{
                HStack {
                    if viewModel.profileOrFeed == "feed" { //feed used in the feed view
                        VStack() {
                            NavigationLink(destination: ProfileView(person: Person(userID: post.userID, username: post.username, firstName: post.firstName, lastName: post.lastName))) {
                                ProfilePictureAvatar(firstName: post.firstName, lastName: post.lastName, imageSize: 50, fontSize: 20)
                                    .buttonStyle(.plain)
                                    .foregroundStyle(Color.primary)
                            }
                            .id(UUID())
                        }
                        .padding(.trailing, 8)
                    } else { //used in 'profile' view
                        VStack() {
                            ProfilePictureAvatar(firstName: post.firstName, lastName: post.lastName, imageSize: 50, fontSize: 20)
                                .buttonStyle(.plain)
                                .foregroundStyle(Color.primary)
                        }
                        .padding(.trailing, 8)
                    }
                    
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
                                    NavigationLink(destination: PostEditView(person: person, post: post)){
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
                            } label: {
                                Label("", systemImage: "ellipsis")
                            }
                            .highPriorityGesture(TapGesture())
                        }
                        .font(.system(size: 13))
                        .padding(.bottom, 2)
                        
                        HStack {
                            if post.postType == "Prayer Request" {
                                Text("Prayer Request: ").font(.system(size: 12)) + Text(post.status.capitalized).font(.system(size: 12)).bold()
                            } else if post.postType == "Praise" {
                                Text("Praise 🙌").font(.system(size: 12))
                            } else {
                                Text("Post 📝").font(.system(size: 12))
                            }
                            Spacer()
                        }
                    }
                }
                
                VStack (alignment: .leading) {
                    Group {
                        // Latest Update Banner.
                        if post.latestUpdateText != "" {
                            VStack (alignment: .leading) {
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
                                .padding(.top, 7)
                                .multilineTextAlignment(.leading)
                                
                                if isTruncated {
                                    NavigationLink(destination: PostFullView(person: Person(userID: post.userID, username: post.username, firstName: post.firstName, lastName: post.lastName), originalPost: $post, lineLimit: .max)) {
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
                                    .fill(scheme == .light ? .gray : .clear)
                                    .stroke(scheme == .light ? .clear : .white, lineWidth: 2)
                                    .opacity(0.06)
                            )
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
                                .italic()
                                .foregroundStyle(Color.blue)
                                .font(.system(size: 14))
                            // technically no need for navigation link since you just click to go to the next page anyways.
                        } // This is to calculate if the text is truncated or not. Background must be the same, but w/o line limit.
                        
                        //comments
                        HStack {
                            Text(post.date, style: .date)
                                .font(.system(size: 12))
                                .padding(.top, 7)
                            Spacer()
                            Button(action: {
                                showComments = true
                            }) {
                                HStack {
                                    Image(systemName: "bubble.left")
                                    Text("Comments")
                                }
                                .font(.footnote)
                                .padding(6)
                                .background(Color.secondary.opacity(0.1))
                                .cornerRadius(8)
                            }
                            .buttonStyle(PlainButtonStyle())
                            .padding(.top, 7)
                        }
                    }
                }
            }
            .foregroundStyle(Color.primary) // make all text primary, instead of traditional 'blue' provided by Swift for Navigation Links.
        }
        .id(UUID())
        .padding([.leading, .trailing], 30)
        .padding([.top, .bottom], 15)
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .sheet(isPresented: $showComments) {
            CommentsView(postID: post.id, isInSheet: true, viewModel: commentViewModel)
        }
        .onChange(of: showComments) { newValue in
            if newValue {
                Task {
                    await commentViewModel.fetchComments(for: post.id)
                }
            }
        }
    }
    
    func pinPost(){
        Task {
            do {
                var isPinnedToggle = post.isPinned
                isPinnedToggle.toggle()
                self.post.isPinned = isPinnedToggle
                
                try await PostHelper().togglePinned(person: userHolder.person, post: post, toggle: isPinnedToggle)
            } catch {
                print(error)
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

extension Color {
    static var random: Color {
        let colors = [
            Color
            .red,
            .green,
            .blue,
            .orange,
//            .yellow,
            .pink,
            .purple,
//            .gray,
            .black,
//            .primary,
            .secondary,
            .accentColor,
            .primary.opacity(0.75),
            .secondary.opacity(0.75),
            .accentColor.opacity(0.75)
        ]
        return colors.randomElement()!
    }
}

//#Preview {
//    PrayerRequestRow(prayerRequest: 
//                        Post(
//                        date: Date(),
//                        userID: "",
//                        username: "lammylol",
//                        firstName: "Matt",
//                        lastName: "Lam",
//                        postTitle: "Prayers for Text",
//                        postText: "Prayers for this text to look beautiful. Prayers for this text to look beautiful.",
//                        postType: "testimony",
//                        status: "Current",
//                        latestUpdateText: "Prayers for this text to look beautiful. Prayers for this text to look beautiful.",
//                        latestUpdateDatePosted: Date(),
//                        latestUpdateType: "Testimony",
//                        privacy: "private",
//                        isPinned: true),
//         profileOrPrayerFeed: "feed")
//        .frame(maxHeight: 300)
//        .environment(UserProfileHolder())
//}
//
//#Preview {
//    LatestUpdate(prayerRequest: PrayerRequest(userID: "", username: "lammylol", date: Date(), prayerRequestText: "Prayers for this text to look beautiful. Prayers for this text to look beautiful.", status: "Current", firstName: "Matt", lastName: "Lam", priority: "high", isPinned: true, prayerRequestTitle: "Prayers for Text", latestUpdateText: "Test Latest update: Prayers for this text to look beautiful. Prayers for this text to look beautiful.", latestUpdateDatePosted: Date(), latestUpdateType: "Testimony"))
//}
