//
//  ChangePasswordView.swift
//  Prayer Calendar
//
//  Created by Matt Lam on 4/15/24.
//

import SwiftUI
import FirebaseAuth

enum PasswordChangeError: Error {
    case wrongCurrentPassword
    case invalidNewPasswordLength
}

struct ProfileSettingsChangePasswordView: View {
    @Environment(UserProfileHolder.self) var userHolder
    @State var currentPassword = ""
    @State var newPassword = ""
    @State var errorText = ""
    
    var body: some View {
        Form {
            Section(header: Text("Current Password")) {
                HStack{
                    Text("Current Password")
                    SecureField("", text: $currentPassword)
                }
            }
            Section(header: Text("New Password")) {
                HStack{
                    Text("New Password")
                    SecureField("", text: $newPassword)
                }
            }
            Section {
                Button(action: {
                    do {
                        try changePassword(currentPassword: currentPassword, newPassword: newPassword)
                        userHolder.userPassword = newPassword
                        errorText = "Password successfully changed."
                        currentPassword = ""
                        newPassword = ""
                    } catch PasswordChangeError.wrongCurrentPassword {
                        errorText = "Current password is incorrect. Please enter the correct password in order to change to your new password."
                    } catch PasswordChangeError.invalidNewPasswordLength {
                        errorText = "New password must be longer than 8 letters."
                    } catch {
                        ViewLogger.error("PasswordChangeView failed to change password \(error)")
                    }
                }) {
                    Text("Change Password")
                        .foregroundStyle(.blue)
                }
            }
        }
        .navigationTitle("Change Password")
        .navigationBarTitleDisplayMode(.inline)
    }
    
    func changePassword(currentPassword: String, newPassword: String) throws -> Void {
        guard currentPassword == userHolder.userPassword else {
            throw PasswordChangeError.wrongCurrentPassword
        }
        
        guard newPassword.count > 8 else {
            throw PasswordChangeError.invalidNewPasswordLength
        }
        
        Auth.auth().currentUser?.updatePassword(to: newPassword)
    }
}


#Preview {
    ProfileSettingsChangePasswordView()
}
