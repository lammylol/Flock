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
    @Environment(\.dismiss) var dismiss
    
    var person: Person
    @State private var datePosted = Date()
    @State private var status: String = "Current"
    @State private var postText: String = ""
    @State private var postTitle: String = ""
    @State private var postType: String = ""
    @State private var privacy: String = "private"
    @State private var isPresentingFriends: Bool = false
    
    var body: some View {
        NavigationView{
            VStack {
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
                                Text("Enter Text. Consider sharing your post in the form of a prayer so that readers can join with you in prayer as they read it.")
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
                                .task {
                                    if person.username == "" && person.userID == userHolder.person.userID {
                                        privacy = "private"
                                    }
                                }
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
//            .sheet(isPresented: $isPresentingFriends, content: {
//                friendsList()
//                    .presentationDetents([.fraction(0.20)])
//            })
            .toolbar {
                ToolbarItemGroup(placement: .topBarLeading) {
                    Button("Cancel") {
                        dismiss()
                    }
                }
                ToolbarItemGroup(placement: .topBarTrailing) {
                    Button(action: {submitList()}) {
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
    }
        
    func submitList() {
        PostHelper().createPost(
            userID: userHolder.person.userID,
            datePosted: Date(),
            person: person,
            postText: postText,
            postTitle: postTitle,
            privacy: privacy,
            postType: postType,
            friendsList: userHolder.friendsList)
        userHolder.refresh = true
        print("Saved")
        dismiss()
    }
    
    func refreshFriends() {
        Task {
            do {
                userHolder.friendsList = try await PersonHelper().getFriendsList(userID: userHolder.person.userID)
                self.userHolder.friendsList = userHolder.friendsList
            } catch {
                print(error)
            }
        }
    }
    
    @ViewBuilder
    func friendsList() -> some View {
        let friendsList = userHolder.friendsList.map({
            $0.firstName + " " + $0.lastName
        }).joined(separator: ", ")
        ScrollView {
            VStack (alignment: .leading) {
                VStack (alignment: .leading) {
                    Text("Who Can See This Post?")
                         .multilineTextAlignment(.leading)
                         .padding(.bottom, 1)
                     Text("\(friendsList)")
                }
                .font(.system(size: 12))
                .padding(.bottom, 10)
                
                HStack {
                    Text("Don't see a friend on here?")
                    Button(action: {
                        self.refreshFriends()
                    }, label: {
                        Text("Refresh")
                            .font(.system(size: 12))
                            .italic()
                    })
                    Spacer()
                }
                .font(.system(size: 12))
            }
        }
    }
}

//#Preview {
//    SubmitPostForm(person: Person(username: "lammylol"))
//        .environment(UserProfileHolder())
//}
