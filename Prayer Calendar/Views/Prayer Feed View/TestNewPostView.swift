//
//  TestNewPostView.swift
//  Prayer Calendar
//
//  Created by Matt Lam on 5/29/24.
//

import SwiftUI

struct PostViewTest: View {
    @Environment(UserProfileHolder.self) var userHolder
    @Environment(\.dismiss) var dismiss
    
    var person: Person
    @State var post: Post
    @State var prayerRequestUpdates: [PostUpdate] = []
    @State var showAddUpdateView: Bool = false
    @State private var originalPrivacy: String = ""
    @State private var expandUpdate: Bool = false
    
    var body: some View {
        NavigationStack {
            ScrollView {
                VStack{
                    HStack {
                        NavigationLink(destination: ProfileView(person: Person(userID: post.userID, username: post.username, firstName: post.firstName, lastName: post.lastName))) {
                            ProfilePictureAvatar(firstName: post.firstName, lastName: post.lastName, imageSize: 50, fontSize: 20)
                                .buttonStyle(.plain)
                                .foregroundStyle(Color.primary)
                        } // Profile Picture
                        .padding(.trailing, 10)
                        
                        VStack() {
                            HStack {
                                Text(post.firstName + " " + post.lastName).font(.system(size: 18)).bold()
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
                                Label("Edit Post", systemImage: "pencil")
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
                    .padding(.bottom, 10)
                    
                    // Latest Update Banner.
                    if post.latestUpdateText != "" {
                        VStack {
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
                            }
                            .font(.system(size: 16))
                            .padding(.bottom, 10)
                            Text("\(post.latestUpdateText)")
                                .multilineTextAlignment(.leading)
                                .lineLimit({
                                    if expandUpdate == false {
                                        6
                                    } else {
                                        .max
                                    }
                                }())
//                                .onTapGesture(perform: {
//                                    self.expandLines()
//                                })
                            HStack {
                                Button {
                                    self.expandLines()
                                } label: {
                                    if expandUpdate == false {
                                        Text("Show More")
                                            .font(.system(size: 14))
                                            .italic()
                                            .foregroundStyle(Color.blue)
                                    } else {
                                        Text("Show Less")
                                            .font(.system(size: 14))
                                            .italic()
                                            .foregroundStyle(Color.blue)
                                    }
                                }
                                Spacer()
                            }
                            .padding(.top, -5)
//                            .padding(.trailing, 5)
                        }
                        .padding(.all, 10)
                        .background(
                            RoundedRectangle(cornerRadius: 10)
                                .fill(.gray)
                                .opacity(0.03)
                        )
                        .foregroundStyle(Color.primary)
                        .padding(.bottom, 7)
                    }
                    
                    // Content of Post
                    VStack(alignment: .leading) {
                        Text("Status: **\(post.status.capitalized)**")
                        Divider()
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
                            .padding(.top, -8)
                        Text(post.postText)
                            .font(.system(size: 16))
                            .frame(maxWidth: .infinity, alignment: .leading)
                            .multilineTextAlignment(/*@START_MENU_TOKEN@*/.leading/*@END_MENU_TOKEN@*/)
                            .padding(.top, 7)
                    }
                    Spacer()
                }
                .foregroundStyle(Color.primary)
                .padding([.leading, .trailing], 20)
                .padding([.top, .bottom], 15)
                .frame(maxWidth: /*@START_MENU_TOKEN@*/.infinity/*@END_MENU_TOKEN@*/, maxHeight: .infinity)
                .task {
                    do {
                        prayerRequestUpdates = try await PrayerUpdateHelper().getPrayerRequestUpdates(prayerRequest: post, person: person)
                    } catch {
                        print("error retrieving")
                    }
                }
                .sheet(isPresented: $showAddUpdateView, onDismiss: {
                    Task {
                        do {
                            prayerRequestUpdates = try await PrayerUpdateHelper().getPrayerRequestUpdates(prayerRequest: post, person: person)
                            post = try await PrayerRequestHelper().getPrayerRequest(prayerRequest: post)
                        } catch {
                            print("error retrieving updates.")
                        }
                    }
                }) {
                    AddPrayerUpdateView(person: person, prayerRequest: post)
                }
            }
//                .navigationBarBackButtonHidden(true)
            .navigationTitle("Post")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar(.hidden, for: .tabBar)
        }
    }
    
    func updatePrayerRequest(prayerRequest: Post) {
        
        // Function to catch if privacy was changed from public to private.
        let newPrivacy = prayerRequest.privacy
        if originalPrivacy != "private" && newPrivacy == "private" {
            PrayerRequestHelper().publicToPrivate(prayerRequest: prayerRequest, friendsList: userHolder.friendsList)
        } // if the privacy has changed from public to private, delete it from friends' feeds.
        
        PrayerRequestHelper().editPrayerRequest(prayerRequest: prayerRequest, person: person, friendsList: userHolder.friendsList)
        self.post = prayerRequest
        
        print("Saved")
        dismiss()
    }
    
    func deletePrayerRequest() {
        PrayerRequestHelper().deletePrayerRequest(prayerRequest: post, person: person, friendsList: userHolder.friendsList)
        userHolder.refresh = true
        
        print("Deleted")
        dismiss()
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

#Preview {
    PostViewTest(person: Person.preview, post: Post.preview, prayerRequestUpdates: PostUpdate.postUpdates)
        .environment(UserProfileHolder())
}
