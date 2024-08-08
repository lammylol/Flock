//
//  AddFriendPage.swift
//  Flock
//
//  Created by Matt Lam on 8/6/24.
//

import SwiftUI

struct AddFriendPage: View {
    @Environment(UserProfileHolder.self) var userHolder
    @Environment(\.dismiss) var dismiss
    @Environment(\.colorScheme) var colorScheme
    
    @State private var firstName: String = ""
    @State private var lastName: String = ""
    @State private var errorAlert: Bool = false
    @FocusState private var focus: Bool
    
    var friendService = FriendService()
    @StateObject var debounceModel = debounceTextModel()
    
    var body: some View {
        NavigationStack{
            VStack(alignment: .leading, spacing: 15) {
                Text("Let's add a friend!")
                    .font(.system(size: 16))
                    .padding(.top, 40)
                    .padding(.bottom, 5)
                
                ZStack { // for username
                    Rectangle()
                        .frame(height: 55)
                        .foregroundStyle(.clear)
                        .border(.secondary)
                    
                    TextField("Search a username", text: $debounceModel.username)
                        .frame(maxWidth: .infinity)
                        .frame(height: 55)
                        .textInputAutocapitalization(.never)
                        .offset(x: 40)
                    
                    HStack {
                        Text("Username")
                            .padding(.horizontal, 7)
                            .font(.system(size: 14))
                            .background {
                                Rectangle().fill(colorScheme == .dark ? .black : .white)
                            }
                            .offset(x: 8, y: -27)
                        Spacer()
                    }
                    HStack {
                        Image(systemName: "magnifyingglass")
                        Spacer()
                    }
                    .offset(x: 15)
                }
                
                VStack {
                    if !debounceModel.validated && debounceModel.username != "" {
                        HStack {
                            Text("No user found.")
                                .font(.system(size: 14))
                            Spacer()
                        }
                    } else if debounceModel.validated && debounceModel.username != "" {
                        HStack {
                            Image(systemName: "checkmark")
                            Text("This account exists for **\(debounceModel.person.firstName.capitalized) \(debounceModel.person.lastName.capitalized)**")
                                .font(.system(size: 14))
                            Spacer()
                        }
                    } else {
                        HStack {
                            Text("")
                        }
                    }// if none of the above, be empty. Need to fill up space
                    Spacer()
                }
                .frame(height: 12)
                .padding(.bottom, 5)
                
                Text("You can create a private profile to pray for your friend that doesn’t have an account! Only you will be able to edit and view the prayer requests for this friend.")
                    .font(.system(size: 14))
                    .padding(.bottom, 5)
                
                ZStack { // for firstName
                    Rectangle()
                        .frame(height: 55)
                        .foregroundStyle(.clear)
                        .border(.secondary)
                    
                    TextField("First Name", text: $firstName)
                        .frame(maxWidth: .infinity)
                        .frame(height: 55)
                        .textInputAutocapitalization(.never)
                        .offset(x: 15)
                    
                    HStack {
                        Text("Name")
                            .padding(.horizontal, 7)
                            .font(.system(size: 14))
                            .background {
                                Rectangle().fill(colorScheme == .dark ? .black : .white)
                            }
                            .offset(x: 8, y: -27)
                        Spacer()
                    }
                }
                .padding(.bottom, 5)
                
                ZStack { // for lastName
                    Rectangle()
                        .frame(height: 55)
                        .foregroundStyle(.clear)
                        .border(.secondary)
                    
                    TextField("Last Name", text: $lastName)
                        .frame(maxWidth: .infinity)
                        .frame(height: 55)
                        .textInputAutocapitalization(.never)
                        .offset(x: 15)
                    
                    HStack {
                        Text("Name")
                            .padding(.horizontal, 7)
                            .font(.system(size: 14))
                            .background {
                                Rectangle().fill(colorScheme == .dark ? .black : .white)
                            }
                            .offset(x: 8, y: -27)
                        Spacer()
                    }
                }
                .padding(.bottom, 40)
                
                HStack {
                    Button {
                        addFriend(username: debounceModel.username)
                    } label: {
                        Text(!debounceModel.validated && firstName != "" ? "Create a Profile" : "Request Friend")
                            .bold()
                            .frame(maxWidth: .infinity)
                    }
                    .background(
                        RoundedRectangle(cornerRadius: 15)
                            .fill(.blue)
                            .frame(height: 55)
                    )
                    .foregroundStyle(.white)
                }
                .frame(maxWidth: .infinity)
                
                Spacer()
            }
            .navigationTitle("Add Friend")
            .padding(.horizontal, 20)
            .toolbar {
                ToolbarItemGroup(placement: .topBarLeading) {
                    Button("Cancel") {
                        DispatchQueue.main.async {
                            dismiss()
                        }
                    }
                }
            }
            .navigationBarBackButtonHidden(true)
            .ignoresSafeArea(.keyboard)
        }
    }
    
    func addFriend(username: String) {
        Task {
            do {
                if username != "" { // functions only if the username exists (aka profile is public)
                    let ref = try await friendService.validateFriendUsername(username: username.lowercased()/*, firstName: firstName, lastName: lastName*/) // returns (bool, person)
                    let validation = ref.0 // true or false if username is validated according to first and last name
                    
                    guard validation else {
                        print("username not valid")
                        errorAlert = true
                        throw AddFriendError.invalidUsername
                    }
                    
                    let person = ref.1 // returns the person model. Happens after validation.
                    
                    try await friendService.addFriend(user: userHolder.person, friend: person) // add friend, but need to wait for approval before historical posts are loaded.
                    
                } else { // if you are making a private profile to track prayers.
                    // guard to make sure firstName and lastName are entered. If already exists, need support use case.
                    // add friend and add user's ID to the private card.
                    
                    guard firstName != "" && lastName != "" else {
                        print("First Name or Last Name cannot be empty.")
                        errorAlert = true
                        throw AddFriendError.missingName
                    }
                    
                    let person = Person(username: username, firstName: firstName, lastName: lastName)
                    
                    try await friendService.addFriend(user: userHolder.person, friend: person) // add friend, but need to wait for approval before historical posts are loaded.
                }
                
                DispatchQueue.main.async {
                    dismiss()
                }
                
            } catch {
                print(error)
            }
        }
    }
}

#Preview {
    AddFriendPage()
        .environment(UserProfileHolder())
}
