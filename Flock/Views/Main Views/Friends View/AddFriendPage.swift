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
    @State private var errorType: AddFriendError?
    @State private var confirmation: Bool = false
    @State private var privateConfirmation: Bool = false
    @FocusState private var focus: Bool
    
    var friendService = FriendService()
    @StateObject var debounceModel = debounceTextModel()
    
    var preName: String = ""
    
    var body: some View {
        NavigationStack{
            ScrollView {
                VStack(alignment: .leading, spacing: 15) {
                    // Public Friend - Search by Username
                    Group {
                        Text("Add a friend by searching by their username.")
                            .font(.system(size: 16))
                            .padding(.top, 30)
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
                                        Rectangle().fill(.background)
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
                        }
                        .frame(height: 12)
                        .offset(y: -4)
                        .padding(.bottom, 5)
                        
                        HStack {
                            Button {
                                addPublicFriend(username: debounceModel.username)
                            } label: {
                                Text("Request Friend")
                                    .bold()
                                    .frame(maxWidth: .infinity)
                            }
                            .background(
                                RoundedRectangle(cornerRadius: 15)
                                    .fill(.blue)
                                    .frame(height: 50)
                            )
                            .foregroundStyle(.white)
                        }
                        .frame(maxWidth: .infinity)
                    }
                    
                    //              'Private Friend' Option.
                    Group {
                        VStack(alignment: .center) {
                            Text("Or")
                                .padding([.vertical], 30)
                            
                            Text("Create a Friend (Private)")
                                .font(.title2)
                                .padding(.bottom, 5)
                            
                            Text("This creates a private profile which allows you to track prayers for a friend who does not have an account. This is linked under your account, so no one will have access to them but you.")
                                .font(.system(size: 14))
                                .padding(.bottom, 5)
                        }
                        
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
                                        Rectangle().fill(.background)
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
                                        Rectangle().fill(.background)
                                    }
                                    .offset(x: 8, y: -27)
                                Spacer()
                            }
                        }
                        
                        HStack {
                            Button {
                                addPrivateFriend(firstName: firstName, lastName: lastName)
                            } label: {
                                Text("Create Friend")
                                    .bold()
                                    .frame(maxWidth: .infinity)
                            }
                            .background(
                                RoundedRectangle(cornerRadius: 15)
                                    .stroke(Color.blue, lineWidth: 1)
                                    .fill(Color.clear)
                                    .frame(height: 50)
                                //                                .border(Color.blue)
                            )
                        }
                        .frame(maxWidth: .infinity)
                        .padding(.top, 20)
                        .padding(.bottom, 10)
                    }
                }
            }
            .alert(isPresented: .constant(errorAlert || confirmation || privateConfirmation)) {
                if errorAlert {
                    return Alert(
                        title: Text(errorType?.failureReason ?? "error"),
                        message: Text(errorType?.errorDescription ?? "error"),
                        dismissButton: .default(Text("OK")) {
                            errorAlert = false
                        })
                } else if confirmation {
                    return Alert(
                        title: Text("Request Sent"),
                        message: Text("Your friend will appear in your list once the request has been approved."),
                        dismissButton: .default(Text("OK")) {
                            confirmation = false
                            DispatchQueue.main.async {
                                dismiss()
                            }
                        })
                } else {
                    return Alert(
                        title: Text("Friend Created"),
                        message: Text("You can now view their profile and start adding any existing prayer requests you would like to be praying for."),
                        dismissButton: .default(Text("OK")) {
                            privateConfirmation = false
                            DispatchQueue.main.async {
                                dismiss()
                            }
                        })
                }
            }
            .toolbar {
                ToolbarItemGroup(placement: .topBarLeading) {
                    Button("Cancel") {
                        DispatchQueue.main.async {
                            dismiss()
                        }
                    }
                }
            }
            .task {
                if preName != "" {
                    let name = splitName(preName)
                    firstName = name?.0 ?? ""
                    lastName = name?.1 ?? ""
                }
            }
            .navigationTitle("Add Friend")
            .navigationBarTitleDisplayMode(.large)
            .navigationBarBackButtonHidden(true)
            .ignoresSafeArea(.keyboard)
            .padding(.horizontal, 20)
        }
    }
    
    func addPublicFriend(username: String) {
        Task {
            do {
                if username != "" { // functions only if the username exists (aka profile is public)
                    guard username.lowercased() != userHolder.person.username else {
                        throw AddFriendError.invalidUsername
                    }
                        
                    let ref = try await friendService.validateFriendUsername(username: username.lowercased()/*, firstName: firstName, lastName: lastName*/) // returns (bool, person)
                    let validation = ref.0 // true or false if username is validated according to first and last name
                    
                    guard validation else {
                        print("username not valid")
                        throw AddFriendError.invalidUsername
                    }
                    
                    let person = ref.1 // returns the person model. Happens after validation.
                    
                    try await friendService.addFriend(user: userHolder.person, friend: person) // add friend, but need to wait for approval before historical posts are loaded.
                    
                } else { // if you are making a private profile to track prayers.
                    // guard to make sure firstName and lastName are entered. If already exists, need support use case.
                    // add friend and add user's ID to the private card.
                    
                    guard firstName != "" && lastName != "" else {
                        print("First Name or Last Name cannot be empty.")
                        throw AddFriendError.missingName
                    }
                    
                    let person = Person(username: username, firstName: firstName, lastName: lastName)
                    
                    try await friendService.addFriend(user: userHolder.person, friend: person) // add friend, but need to wait for approval before historical posts are loaded.
                }
                
                confirmation = true
                
            } catch let AddFriendError as AddFriendError {
                self.errorType = AddFriendError
                errorAlert = true
            } catch {
                print(error)
                errorAlert = true
                self.errorType = nil
            }
        }
    }
    
    func addPrivateFriend(firstName: String, lastName: String) {
        Task {
            try await friendService.addPrivateFriend(firstName: firstName.lowercased(), lastName: lastName.lowercased(), user: userHolder.person)
            privateConfirmation = true
        }
    }
    
    func splitName(_ fullName: String) -> (String, String?)? {
        let components = fullName.split(separator: " ")
        guard !components.isEmpty else { return nil }
        
        let firstName = String(components[0])
        
        if components.count == 2 {
            let lastName = String(components[1])
            return (firstName, lastName)
        } else if components.count == 1 {
            return (firstName, nil)
        } else {
            return nil
        }
    }
}
//
//#Preview {
//    AddFriendPage()
//        .environment(UserProfileHolder())
//}
