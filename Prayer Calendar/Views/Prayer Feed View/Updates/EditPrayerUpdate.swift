//
//  PrayerUpdateView.swift
//  Prayer Calendar
//
//  Created by Matt Lam on 2/22/24.
//

import SwiftUI

struct EditPrayerUpdate: View {
    @Environment(UserProfileHolder.self) var userHolder
    @Environment(\.dismiss) var dismiss
    
    var person: Person
    @State var prayerRequest: Post
    @State var prayerRequestUpdates: [PostUpdate] = []
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
                        Text(update.prayerUpdateText).foregroundColor(Color.clear)//this is a swift workaround to dynamically expand textEditor.
                        TextEditor(text: $update.prayerUpdateText)
                            .offset(x: -5, y: -1)
                    }
                    Picker("Update Type", selection: $update.updateType) {
                        Text("Testimony").tag("Testimony")
                        Text("Update").tag("Update")
//                        Text("Update (Public)").tag("Update")
//                        Text("Update (Private)").tag("Update (Private)")
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
        var updates = prayerRequestUpdates.sorted(by: {$1.datePosted > $0.datePosted})
        print("before:")
        print(updates)
        updates.removeAll(where: {$0.id == update.id}) // must come first in order to make sure the prayer request last date posted can be factored correctly.
        print("after:")
        print(updates)
        PrayerUpdateHelper().deletePrayerUpdate(prayerRequest: prayerRequest, prayerRequestUpdate: update, updatesArray: updates, person: person, friendsList: userHolder.friendsList)
        print("Deleted")
        dismiss()
    }
    
    func updatePrayerUpdate() {
        PrayerUpdateHelper().editPrayerUpdate(prayerRequest: prayerRequest, prayerRequestUpdate: update, person: person, friendsList: userHolder.friendsList, updatesArray: prayerRequestUpdates)
        print("Saved")
        dismiss()
    }
    
}

struct AddPrayerUpdateView: View {
    @Environment(UserProfileHolder.self) var userHolder
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
//                        Text("Update (Public)").tag("Update")
//                        Text("Update (Private)").tag("Update (Private)")
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
        PrayerUpdateHelper().addPrayerRequestUpdate(datePosted: Date(), prayerRequest: prayerRequest, prayerRequestUpdate: update, person: person, friendsList: userHolder.friendsList)
        print("Saved")
        dismiss()
    }
}

//#Preview {
//    PrayerUpdateView()
//}
