//
//  PrayerUpdateView.swift
//  Prayer Calendar
//
//  Created by Matt Lam on 2/22/24.
//

import SwiftUI

struct EditPrayerUpdate: View {
    @Environment(UserProfileHolder.self) var userHolder
    @Environment(FriendRequestListener.self) var friendRequestListener
    @Environment(\.dismiss) var dismiss
    
    var person: Person
    @State var post: Post
    @State var postUpdates: [PostUpdate] = []
    @State var update: PostUpdate
    
    var body: some View {
        NavigationView {
            Form {
                Section(header: Text("Date Posted: \(update.datePosted.formatted(.dateTime))")) {
                    ZStack(alignment: .topLeading) {
                        if update.prayerUpdateText == "" {
                            Text("Text")
                                .padding(.leading, 0)
                                .padding(.top, 8)
                                .foregroundStyle(Color.gray)
                        }
                        Text(update.prayerUpdateText)
                            .hidden() //this is a swift workaround to dynamically expand textEditor.
                            .frame(maxWidth: .infinity, maxHeight: .infinity)
                            .padding(.all, 8)//this is a swift workaround to dynamically expand textEditor.
                        TextEditor(text: $update.prayerUpdateText)
                            .offset(x: -5, y: -1)
                    }
                    Picker("Update Type", selection: $update.updateType) {
                        Text("Testimony").tag("Testimony")
                        Text("Update").tag("Update")
                }
                }
            }
        }
        .toolbar {
            ToolbarItem(placement: .automatic) {
                Button(action: {
                    updatePrayerUpdate()
                }) {
                    Text("Update")
                        .offset(x: -4)
                        .font(.system(size: 14))
                        .padding([.leading, .trailing], 5)
                        .bold()
                }
                .background(
                    RoundedRectangle(cornerRadius: 15)
                        .fill(.blue)
                )
                .foregroundStyle(.white)
            }
            
            if person.username == "" || (person.userID == userHolder.person.userID) {
                ToolbarItemGroup(placement: .bottomBar) {
                    Button(action: {deleteUpdate()}) {
                        Text("Delete Update")
                            .font(.system(size: 14))
                            .padding([.leading, .trailing], 5)
                    }
                    .background(
                        RoundedRectangle(cornerRadius: 15)
                            .fill(.red)
                    )
                    .foregroundStyle(.white)
                }
            }
        }
        .navigationBarTitleDisplayMode(.inline)
        .navigationBarTitle(update.updateType)
    }
    
    func deleteUpdate() {
        Task {
            do {
                try await PostUpdateHelper().deletePostUpdate(post: post, update: update, updatesArray: postUpdates, person: person, friendsList: friendRequestListener.acceptedFriendRequests)
                
                // DispatchQueue ensures that dismiss happens on the main thread.
                DispatchQueue.main.async {
                    dismiss()
                }
            } catch {
                ViewLogger.error("EditPrayerUpdate.deleteUpdate \(error)")
            }
        }
    }
    
    func updatePrayerUpdate() {
        Task {
            do {
                try await PostUpdateHelper().editPrayerUpdate(prayerRequest: post, prayerRequestUpdate: update, person: person, friendsList: friendRequestListener.acceptedFriendRequests, updatesArray: postUpdates)
                
                // DispatchQueue ensures that dismiss happens on the main thread.
                DispatchQueue.main.async {
                    dismiss()
                }
            } catch {
                ViewLogger.error("EditPrayerUpdate.updatePrayerUpdate \(error)")
            }
        }
    }
    
}

struct AddPrayerUpdateView: View {
    @Environment(UserProfileHolder.self) var userHolder
    @Environment(FriendRequestListener.self) var friendRequestListener
    @Environment(\.dismiss) var dismiss
    
    var person: Person
    @State var prayerRequest: Post
    @State var update: PostUpdate = PostUpdate(datePosted: Date(), prayerUpdateText: "", updateType: "Testimony")
    
    var body: some View {
        NavigationStack {
            Form {
                Section(header: Text("Add Update to Post")) {
                    ZStack(alignment: .topLeading) {
                        if update.prayerUpdateText == "" {
                            Text("Text")
                                .padding(.leading, 0)
                                .padding(.top, 8)
                                .foregroundStyle(Color.gray)
                        }
                        Text(update.prayerUpdateText).foregroundColor(Color.clear)//this is a swift workaround to dynamically expand textEditor.
                        TextEditor(text: $update.prayerUpdateText)
                            .offset(x: -5, y: -1)

                        }
                    }
                    Picker("Update Type", selection: $update.updateType) {
                        Text("Testimony").tag("Testimony")
                        Text("Update").tag("Update")
                }
            }
            .toolbar {
                ToolbarItemGroup(placement: .topBarLeading) {
                    Button("Cancel") {
                        dismiss()
                    }
                }
                ToolbarItemGroup(placement: .topBarTrailing) {
                    Button(action: {self.addUpdate()}) {
                        Text("Add")
                            .offset(x: -4)
                            .font(.system(size: 14))
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
            .navigationTitle("Add Update")
            .navigationBarTitleDisplayMode(.inline)
        }
    }
    
    func addUpdate() {
        Task {
            do {
                try await PostUpdateHelper().addPrayerRequestUpdate(datePosted: Date(), post: prayerRequest, prayerRequestUpdate: update, person: person, friendsList: friendRequestListener.acceptedFriendRequests)
                
                // DispatchQueue ensures that dismiss happens on the main thread.
                DispatchQueue.main.async {
                    dismiss()
                }
            } catch {
                ViewLogger.error("EditPrayerUpdate.addUpdate \(error)")
            }
        }
    }
}

//#Preview {
//    PrayerUpdateView()
//}
