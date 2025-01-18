//
//  ProfileSettingsView.swift
//  Prayer Calendar
//
//  Created by Matt Lam on 2/9/24.
//

import SwiftUI
import FirebaseFirestore
import FirebaseAuth

// Settings page for user to edit profile information.
struct ProfileSettingsView: View {
    @Environment(UserProfileHolder.self) var userHolder
    @Environment(FriendRequestListener.self) var friendRequestListener

    var body: some View {
        Form {
            Section {
                HStack (alignment: .center) {
                    Spacer()
                    VStack {
                        ProfilePictureAvatar(firstName: userHolder.person.firstName, lastName: userHolder.person.lastName, imageSize: 40, fontSize: 20)
                        Text(userHolder.person.firstName + " " + userHolder.person.lastName)
                    }
                    Spacer()
                }
                .alignmentGuide(.listRowSeparatorLeading) { _ in 0 } // extends automatic separator divider. If not, it looks weird.
                
                NavigationLink(destination: AccountSettings()){
                    Text("Account Settings")
                }
            }
            Section{
                Button(action: {
                    self.signOut()
                }) {Text("Sign Out")
                        .font(.system(size: 16))
                        .foregroundColor(.red)
                }
            }
            .frame(alignment: .center)
        }
        .navigationTitle("Settings")
    }
    
    func signOut() {
        // Sign out from firebase and change loggedIn to return to SignInView.
        Task {
            if userHolder.isFinished {
                do {
                    friendRequestListener.removeListener()
                    try Auth.auth().signOut()
                } catch {
                    ViewLogger.error("ProfileSettingsView signOut failed \(error)")
                }
            }
        }
    }
}

struct DeleteButton: View {
    @Environment(UserProfileHolder.self) var userHolder
    @Environment(FriendRequestListener.self) var friendRequestListener
    @State private var isPresentingConfirm: Bool = false
    private var friendService = FriendService()
    
    var body: some View {
        Button("Delete Account", role: .destructive) {
            isPresentingConfirm = true
        }
        .confirmationDialog("Are you sure?",
                            isPresented: $isPresentingConfirm) {
            Button("Delete Account and Sign Out", role: .destructive) {
                Task {
                    do {
                        if userHolder.isFinished {
                            try await friendService.deletePerson(user: userHolder.person, friendsList: friendRequestListener.acceptedFriendRequests)
                        }
                    } catch {
                        ViewLogger.error("ProfileSettingsView DeleteAndSignout error \(error)")
                    }
                }
            }
        } message: {
            Text("Are you sure you would like to delete your account? Deleting account will remove all history of prayer requests both in your account and in any friend feeds, and will not be able to be restored.")
        }
    }
    
    func signOut() {
        Task {
            if userHolder.isFinished {
                do {
                    resetInfo()
                    friendRequestListener.removeListener()
                    try Auth.auth().signOut()
                } catch {
                    ViewLogger.error("ProfileSettingsView signOut failed \(error)")
                }
            }
        }
    }
    
    func resetInfo() {
        Task {
            await UserService().resetInfoOnSignout(listener: friendRequestListener, userHolder: userHolder)
        }
    }
}

struct AccountSettings: View {
    @Environment(UserProfileHolder.self) var userHolder
    
    var body: some View {
        Form {
            Section {
                NavigationLink(destination: ProfileSettingsChangePasswordView()){
                    Text("Change Password")
                }
                .id(UUID())
            }
            Section {
                DeleteButton()
            }
        }
        .navigationTitle("Account Settings")
        .navigationBarTitleDisplayMode(.inline)
    }
}
