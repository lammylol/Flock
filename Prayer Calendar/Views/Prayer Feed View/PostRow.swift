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
    @Binding var post: Post
    @Environment(UserProfileHolder.self) var userHolder
    
    // For Update
    @State private var expandUpdate: Bool = false
    @State private var truncatedTextSize: CGFloat = .zero
    @State private var expandTextSize: CGFloat = .zero
    @State private var isTruncated: Bool = false
    
    // For Main Text
    @State private var postExpandUpdate: Bool = false
    @State private var postTruncatedTextSize: CGFloat = .zero
    @State private var postExpandTextSize: CGFloat = .zero
    @State private var postIsTruncated: Bool = false
    
    var body: some View {
        NavigationLink(destination: PostView(person: Person(userID: post.userID, username: post.username, firstName: post.firstName, lastName: post.lastName), post: $post)) {
            LazyVStack{
                HStack {
                    if viewModel.profileOrFeed == "feed" { //feed used in the feed view
                        VStack() {
                            NavigationLink(destination: ProfileView(person: Person(userID: post.userID, username: post.username, firstName: post.firstName, lastName: post.lastName))) {
                                ProfilePictureAvatar(firstName: post.firstName, lastName: post.lastName, imageSize: 50, fontSize: 20)
                                    .buttonStyle(.plain)
                                    .foregroundStyle(Color.primary)
                            }.id(UUID())
                            Spacer()
                        }
                        .padding(.trailing, 10)
                    } else { //used in 'profile' view
                        VStack() {
                            ProfilePictureAvatar(firstName: post.firstName, lastName: post.lastName, imageSize: 50, fontSize: 20)
                                .buttonStyle(.plain)
                                .foregroundStyle(Color.primary)
                            Spacer()
                        }
                        .padding(.trailing, 10)
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
                                    
                                    Text("\(post.latestUpdateText)")
                                        .font(.system(size: 16))
                                        .padding(.top, 7)
                                        .padding(.bottom, 10)
                                        .multilineTextAlignment(.leading)
                                        .lineLimit({
                                            6
                                        }())
                                }
                                .padding(.all, 10)
                                .background(
                                    RoundedRectangle(cornerRadius: 10)
                                        .fill(.gray)
                                        .opacity(0.06)
                                )
                                .foregroundStyle(Color.primary)
                                .padding(.bottom, 7)// Group for latest banner with truncation methodology.
                            }
                        }
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
                        Text("\(post.postText)")
                            .font(.system(size: 16))
                            .padding(.top, 7)
                            .padding(.bottom, 10)
                            .multilineTextAlignment(.leading)
                            .lineLimit({
                                20
                            }())
                        HStack {
                            Text(post.date, style: .date)
                                .font(.system(size: 12))
                                .padding(.top, 7)
                        }
                    }
                    .foregroundStyle(Color.primary)
                }
                .padding([.leading, .trailing], 20)
                .padding([.top, .bottom], 15)
                .frame(maxWidth: .infinity, maxHeight: .infinity)
            }
        }
        .id(UUID())
    }
    func pinPrayerRequest(){
        var isPinnedToggle = post.isPinned
        isPinnedToggle.toggle()
        self.post.isPinned = isPinnedToggle
        
        if isPinnedToggle == true {
            userHolder.pinnedPrayerRequests.append(post)
        } else {
            userHolder.pinnedPrayerRequests.removeAll(where: { $0.id == post.id})
        }
        
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
