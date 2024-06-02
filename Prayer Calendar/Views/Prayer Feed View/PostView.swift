//
//  EditPrayerRequestForm.swift
//  Prayer Calendar
//
//  Created by Matt Lam on 11/17/23.
//
// Description: This is the form to edit an existing prayer request.

import SwiftUI

struct PostView: View {
    @Environment(UserProfileHolder.self) var userHolder
    @State var prayerRequestUpdates: [PostUpdate] = []
    @State var person: Person
    @Binding var post: Post
    @State var showAddUpdateView: Bool = false
    @State private var originalPrivacy: String = ""
    @State private var expandUpdate: Bool = false
    @State private var truncatedTextSize: CGFloat = .zero
    @State private var expandTextSize: CGFloat = .zero
    @State private var isTruncated: Bool = false
    @State var lineLimit: Int = 6 // This is to set default setting for max lines shown, set as a var so a user can pass in .max if they are calling directly from the feed.
    
    var body: some View {
        NavigationStack {
            ScrollView {
                LazyVStack{
                    HStack {
                        NavigationLink(destination: ProfileView(person: Person(userID: post.userID, username: post.username, firstName: post.firstName, lastName: post.lastName))) {
                            ProfilePictureAvatar(firstName: post.firstName, lastName: post.lastName, imageSize: 50, fontSize: 20)
                                .buttonStyle(.plain)
                                .foregroundStyle(Color.primary)
                        } // Profile Picture
                        .padding(.trailing, 10)
                        .id(UUID())
                        
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
                                NavigationLink(destination: PostEditView(person: person, post: post)){
                                    Label("Edit Post", systemImage: "pencil")
                                }
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
                            Group {
                                ZStack {
                                    Text("\(post.latestUpdateText)")
                                        .font(.system(size: 16))
                                        .padding(.top, 7)
                                        .padding(.bottom, 10)
                                        .multilineTextAlignment(.leading)
                                        .lineLimit({
                                            if expandUpdate == false {
                                                lineLimit
                                            } else {
                                                .max
                                            }
                                        }())
                                        .getSizeOfView(completion: {
                                            truncatedTextSize = $0
                                        })
                                        .background(
                                            Text("\(post.latestUpdateText)")
                                                .fixedSize(horizontal: false, vertical: true)
                                                .padding(.top, 7)
                                                .padding(.bottom, 10)
                                                .multilineTextAlignment(.leading)
                                                .getSizeOfView(completion: {
                                                    expandTextSize = $0
                                                })
                                                .hidden()
                                        )
                                } // This is to calculate if the text is truncated or not. Background must be the same, but w/o line limit.
                                
                                if truncatedTextSize != expandTextSize && !expandUpdate { // only if text is truncated, and if expandUpdate hasn't been triggered to true already
                                    HStack {
                                        Button {
                                            self.expandLines()
                                        } label: {
                                            Text("Show More")
                                                .font(.system(size: 14))
                                                .italic()
                                                .foregroundStyle(Color.blue)
                                        }
                                        Spacer()
                                    }
                                    .padding(.top, -5)
                                } else if expandUpdate == true { // if expandUpdate is true, you will always show 'show less'
                                        Button {
                                            self.expandLines()
                                        } label: {
                                            Text("Show Less")
                                                .font(.system(size: 14))
                                                .italic()
                                                .foregroundStyle(Color.blue)
                                        }
                                    }
                            } // Group for truncation methodology.
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
                        Text("Status: **\(post.status.capitalized)**")
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
                    Spacer()
                    //                    if post.latestUpdateText != "" {
                    //                        VStack (alignment: .leading) {
                    //                            HStack {
                    //                                Image(systemName: "arrow.turn.up.right")
                    //                                Text("**Latest \(post.latestUpdateType)**: \(post.latestUpdateDatePosted.formatted(date: .abbreviated, time: .omitted)), \(post.latestUpdateText)")
                    //                                    .multilineTextAlignment(.leading)
                    //                                    .font(.system(size: 16))
                    //                                    .padding(.bottom, 0)
                    //                            }
                    //                            HStack {
                    //                                Text("\(post.postText)")
                    //                                    .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .leading)
                    //                                    .lineLimit(15)
                    //                                    .fixedSize(horizontal: false, vertical: true)
                    //                                    .font(.system(size: 16))
                    //                                    .multilineTextAlignment(/*@START_MENU_TOKEN@*/.leading/*@END_MENU_TOKEN@*/)
                    //                            }
                    //                        }
                    //                        .padding(.top, 7)
                    //                    } else {
                    //                        VStack {
                    //                            Text(post.postText)
                    //                                .font(.system(size: 16))
                    //                                .frame(maxWidth: .infinity, alignment: .leading)
                    //                                .multilineTextAlignment(/*@START_MENU_TOKEN@*/.leading/*@END_MENU_TOKEN@*/)
                    //                                .padding(.top, 7)
                    //                        }
                    //                    }
                }
            }
            .task {
                do {
//                    self.post = try await PrayerRequestHelper().getPrayerRequest(prayerRequest: post)
                    print("isPinned: " + post.isPinned.description)
                    originalPrivacy = post.privacy // for catching public to private.
                } catch PrayerRequestRetrievalError.noPrayerRequestID {
                    print("missing prayer request ID for update.")
                } catch {
                    print("error retrieving")
                }
            }
            .padding([.leading, .trailing], 20)
            .padding([.top, .bottom], 15)
            .navigationTitle("Post")
            .navigationBarTitleDisplayMode(.inline)
            .frame(maxWidth: /*@START_MENU_TOKEN@*/.infinity/*@END_MENU_TOKEN@*/, maxHeight: .infinity)
        }
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
                    Picker("Status", selection: $post.status) {
                        Text("Current").tag("Current")
                        Text("Answered").tag("Answered")
                        Text("No Longer Needed").tag("No Longer Needed")
                    }
                    Picker("Type", selection: $post.postType) {
                        Text("Default (Post)").tag("Default")
                        Text("Praise").tag("Praise")
                        Text("Prayer Request").tag("Prayer Request")
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
                        Text(post.postText)
                            .foregroundStyle(Color.clear)//this is a swift workaround to dynamically expand textEditor.
                        //                            .padding([.top, .bottom], 5)
                        TextEditor(text: $post.postText)
                            .offset(x: -5, y: -1)
                    }
                    //                        NavigationLink(destination: EditPrayerRequestTextView(person: person, postText: $post.postText)) {
                    //                            // Navigation to edit text. Not binding because we want it to only update upon submission.
                    //                            Text(post.postText)
                    //                        }
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
                        deletePrayerRequest()
                    }) {Text("Delete Prayer Request")
                        //                                .font(.system(size: 16))
                            .foregroundColor(.red)
                            .frame(maxWidth: .infinity, alignment: .center)
                    }
                }
            }
            .task {
                do {
                    self.post = try await PrayerRequestHelper().getPrayerRequest(prayerRequest: post)
                    self.post = post
                    prayerRequestUpdates = try await PrayerUpdateHelper().getPrayerRequestUpdates(prayerRequest: post, person: person)
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
                        prayerRequestUpdates = try await PrayerUpdateHelper().getPrayerRequestUpdates(prayerRequest: post, person: person)
                        post = try await PrayerRequestHelper().getPrayerRequest(prayerRequest: post)
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
                        updatePrayerRequest(post: post)
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
    
    func updatePrayerRequest(post: Post) {

        let newPrivacy = post.privacy
        if originalPrivacy != "private" && newPrivacy == "private" {
            PrayerRequestHelper().publicToPrivate(prayerRequest: post, friendsList: userHolder.friendsList)
        } // if the privacy has changed from public to private, delete it from friends' feeds.
        
        // Function to catch if privacy was changed from public to private.
        
        Task {
            do {
                PrayerRequestHelper().editPrayerRequest(prayerRequest: post, person: person, friendsList: userHolder.friendsList) // edit prayer request in firebase
            }
        }
        print("Saved")
        dismiss()
    }
    
    func deletePrayerRequest() {
        PrayerRequestHelper().deletePrayerRequest(prayerRequest: post, person: person, friendsList: userHolder.friendsList)
        userHolder.refresh = true
        
        print("Deleted")
        dismiss()
    }
}

//
//struct EditPrayerRequestTextView: View {
//    @Environment(UserProfileHolder.self) var userHolder
//    @Environment(\.dismiss) var dismiss
//    
//    var person: Person
//    @Binding var postText: String
//    @State private var prayerRequestOriginalText: String = ""
//    
//    var body: some View {
//        NavigationView {
//            Form {
//                Section(header: Text("Edit Post")) {
//                    ZStack(alignment: .topLeading) {
//                        if postText.isEmpty {
//                            Text("Enter text")
//                                .padding(.top, 8)
//                                .foregroundStyle(Color.gray)
//                        }
//                        Text(postText).foregroundColor(Color.clear)//this is a swift workaround to dynamically expand textEditor.
//                            .padding([.top, .bottom], 5)
//                        TextEditor(text: $postText)
//                            .offset(x: -5)
//                    }
//                }
//            }
//        }
//        .task {
//            self.prayerRequestOriginalText = postText
//        }
//        .toolbar {
//            ToolbarItemGroup(placement: .topBarTrailing) {
//                Button(action: {
////                    updatePrayerRequest(prayerRequest: post)
//                    dismiss()
//                }) {
//                    Text("Update")
//                        .offset(x: -4)
//                        .font(.system(size: 14))
//                        .padding([.leading, .trailing], 5)
//                        .bold()
//                }
//                .background(
//                    RoundedRectangle(cornerRadius: 15)
//                        .fill(.blue)
//                )
//                .foregroundStyle(.white)
//            }
//            ToolbarItemGroup(placement: .topBarTrailing) {
//                Button(action: {
//                    self.postText = prayerRequestOriginalText
//                    dismiss()
//                }) {
//                    Text("Edit Post")
//                    
//                }
//            }
//        }
//        .navigationTitle("Edit Post")
//        .navigationBarTitleDisplayMode(.inline)
//    }
                
//    func updatePrayerRequest(prayerRequest: Post) {
//        PrayerRequestHelper().editPrayerRequest(prayerRequest: prayerRequest, person: person, friendsList: userHolder.friendsList)
//        print("Saved")
//        dismiss()
//    }
//}
