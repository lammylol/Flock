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
    @Environment(UserProfileHolder.self) var userHolder
    
    // For Update
    @State private var expandUpdate: Bool = false
//    @State private var truncatedTextSize: CGFloat = .zero
//    @State private var expandTextSize: CGFloat = .zero
    @State private var isTruncated: Bool = false
    
    // For Main Text
    @State private var postExpandUpdate: Bool = false
//    @State private var postTruncatedTextSize: CGFloat = .zero
//    @State private var postExpandTextSize: CGFloat = .zero
    @State private var postIsTruncated: Bool = false
    
    var body: some View {
        NavigationLink(destination: PostView(person: Person(userID: post.userID, username: post.username, firstName: post.firstName, lastName: post.lastName), oldPost: $post)) {
            LazyVStack{
                HStack {
                    if viewModel.profileOrFeed == "feed" { //feed used in the feed view
                        VStack() {
                            NavigationLink(destination: ProfileView(person: Person(userID: post.userID, username: post.username, firstName: post.firstName, lastName: post.lastName))) {
                                ProfilePictureAvatar(firstName: post.firstName, lastName: post.lastName, imageSize: 50, fontSize: 20)
                                    .buttonStyle(.plain)
                                    .foregroundStyle(Color.primary)
                            }.id(UUID())
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
                        HStack() {
                            Text(post.firstName + " " + post.lastName).font(.system(size: 18)).bold()
                            Spacer()
                            if post.isPinned == true {
                                Image(systemName: "pin.fill")
                            }
                            Privacy(rawValue: post.privacy)?.systemImage
                            Menu {
                                if post.userID == userHolder.person.userID {
                                    NavigationLink(destination: PostEditView(person: userHolder.person, post: post)){
                                        Label("Edit Post", systemImage: "pencil")
                                    } // can only edit if you are the owner of the post.
                                }
                                Button {
                                    self.pinPrayerRequest()
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
                        HStack() {
                            Text("Prayer Status: ").font(.system(size: 12)).italic() + Text(post.status.capitalized)
                                .font(.system(size: 12))
                                .italic()
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
                                    NavigationLink(destination: PostView(person: Person(userID: post.userID, username: post.username, firstName: post.firstName, lastName: post.lastName), oldPost: $post, lineLimit: .max)) {
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
                                    .padding(.top, 7)
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
                        
                        HStack {
                            Text(post.date, style: .date)
                                .font(.system(size: 12))
                                .padding(.top, 7)
                            Spacer()
                        }
                    }
                }
            }
            .foregroundStyle(Color.primary)
        }
        .id(UUID())
        .padding([.leading, .trailing], 30)
        .padding([.top, .bottom], 15)
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }
    
    func pinPrayerRequest(){
        var isPinnedToggle = post.isPinned
        isPinnedToggle.toggle()
        self.post.isPinned = isPinnedToggle
//        
//        if isPinnedToggle == true {
//            userHolder.pinnedPrayerRequests.append(post)
//        } else {
//            userHolder.pinnedPrayerRequests.removeAll(where: { $0.id == post.id})
//        }
        
        PrayerRequestHelper().togglePinned(person: userHolder.person, prayerRequest: post, toggle: isPinnedToggle)
//        userHolder.refresh = true
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
    var prayerRequest: Post
    
    var body: some View {
        VStack(alignment: .leading) {
            Text("\(prayerRequest.latestUpdateType): \(prayerRequest.latestUpdateText)")
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
