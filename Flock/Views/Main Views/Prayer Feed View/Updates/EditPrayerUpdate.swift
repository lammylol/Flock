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
                var updates = prayerRequestUpdates.sorted(by: {$1.datePosted > $0.datePosted})
                print("before:")
                print(updates)
                updates.removeAll(where: {$0.id == update.id}) // must come first in order to make sure the prayer request last date posted can be factored correctly.
                print("after:")
                print(updates)
                
                try await PostUpdateHelper().deletePrayerUpdate(prayerRequest: prayerRequest, prayerRequestUpdate: update, updatesArray: updates, person: person, friendsList: userHolder.friendsList)
                
                print("Deleted")
                
                // DispatchQueue ensures that dismiss happens on the main thread.
                DispatchQueue.main.async {
                    dismiss()
                }
            } catch {
                print(error)
            }
        }
    }
    
    func updatePrayerUpdate() {
        Task {
            do {
                try await PostUpdateHelper().editPrayerUpdate(prayerRequest: prayerRequest, prayerRequestUpdate: update, person: person, friendsList: userHolder.friendsList, updatesArray: prayerRequestUpdates)
                print("Saved")
                
                // DispatchQueue ensures that dismiss happens on the main thread.
                DispatchQueue.main.async {
                    dismiss()
                }
            } catch {
                print(error)
            }
        }
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
                try await PostUpdateHelper().addPrayerRequestUpdate(datePosted: Date(), prayerRequest: prayerRequest, prayerRequestUpdate: update, person: person, friendsList: userHolder.friendsList)
                print("Saved")
                
                // DispatchQueue ensures that dismiss happens on the main thread.
                DispatchQueue.main.async {
                    dismiss()
                }
            } catch {
                print(error)
            }
        }
    }
}

//#Preview {
//    PrayerUpdateView()
//}
