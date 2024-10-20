//
//  SignInView.swift
//  Prayer Calendar
//
//  Created by Matt Lam on 11/1/23.
//

import SwiftUI
import FirebaseAuth
import FirebaseFirestore

enum AuthError: Error {
    case networkError
    case invalidPassword
    case noUserFound
}

struct SignInView: View {
    @Environment(UserProfileHolder.self) var userHolder
    @Environment(FriendRequestListener.self) var friendRequestListener
    
    @State private var email = ""
    @State private var password = ""
    @State private var errorMessage = ""
    @State private var showCreateAccount = false
    @State private var showForgotPassword = false
    
    var body: some View {
        Group {
            if userHolder.isLoading {
                LoadingView() // A simple loading view can be defined separately
            } else if userHolder.isLoggedIn == .authenticated && !userHolder.isLoading {
                ContentView(selection: 1)
            } else {
                signInForm
            }
        }
        .task {
            await handleLoginState()
        }
    }
    
    private var signInForm: some View {
        VStack(/*spacing: 20*/) {
            Spacer()

            Text("Welcome")
                .font(.largeTitle)
                .bold()
                .offset(x: -80)

            VStack {
                ZStack {
                    VStack {
                        HStack {
                            Text("Email: ")
                                .padding(.leading, 40)
                            MyTextField(placeholder: "", text: $email, textPrompt: "enter email", textFieldType: "text")
                                .textContentType(.emailAddress)
                        }
                        Rectangle()
                            .frame(height: 1)
                            .padding([.leading, .trailing], 40)
                    }

                    VStack {
                        Spacer()
                            .frame(height: 90)
                        HStack {
                            Text("Password: ")
                                .padding(.leading, 40)
                            MyTextField(placeholder: "", text: $password, textPrompt: "enter password", textFieldType: "secure")
                                .textContentType(.password)
                        }
                    }
                }
            }
            .frame(height: 125)

            Rectangle()
                .frame(height: 1)
                .padding([.leading, .trailing], 40)

            HStack {
                Button(action: {
                    showForgotPassword.toggle()
                }) {
                    Text("Forgot Password?")
                        .foregroundStyle(.blue)
                        .font(.system(size: 16))
                }
                Spacer()
            }
            .padding([.leading, .trailing], 40)
            .padding(.top, 5)

            Button(action: {
                Task {
                    signIn()
                }
            }) {Text("Sign In")
                    .bold()
                    .frame(height: 35)
                    .frame(maxWidth: .infinity)
            }
            .background(
                RoundedRectangle(cornerRadius: 5)
                    .fill(.blue)
            )
            .padding([.leading, .trailing], 40)
            .foregroundStyle(.white)
            .padding(.top, 30)

            if errorMessage != "" {
                Text(errorMessage)
                    .font(.system(size: 16))
                    .foregroundStyle(Color.red)
                    .padding([.leading, .trailing], 40)
                    .padding([.top, .bottom], 15)
            }

            HStack {
                Text("Don't have an account yet? ")
                Button(action: {
                    showCreateAccount.toggle()
                }) {
                    Text("Sign Up")
                }
            }
            .padding([.top, .bottom], 15)

            Spacer()

        }
        .sheet(isPresented: $showCreateAccount, onDismiss: {
            errorMessage = ""
        }) {
            CreateProfileView()
        }
        .sheet(isPresented: $showForgotPassword, onDismiss: {
            errorMessage = ""
        }) {
            ForgotPassword()
        }
    }
    
    private func signIn() {
        Auth.auth().signIn(withEmail: email, password: password) { result, error in
            if let error = error {
                handleAuthError(error)
            } else {
                Task {
                    await setInfo()
                }
            }
        }
    }
    
    private func handleAuthError(_ error: Error) {
        let authError = error as NSError
        switch AuthErrorCode.Code(rawValue: authError.code) {
        case .userNotFound:
            errorMessage = "No account found with these credentials."
        case .wrongPassword:
            errorMessage = "Incorrect password entered. Please try again."
        case .invalidEmail:
            errorMessage = "Invalid email entered. Please enter a valid email."
        default:
            errorMessage = "Invalid Credentials."
        }
    }
    
    private func handleLoginState() async {
        if userHolder.isLoggedIn == .authenticated {
            await setInfo()
        } else {
            resetInfo()
        }
    }
    
    private func resetInfo() {
        // Reset user information and other states as needed
        Task {
            await UserService().resetInfoOnSignout(listener: friendRequestListener, userHolder: userHolder)
        }
//        friendRequestListener.acceptedFriendRequests = []
//        friendRequestListener.pendingFriendRequests = []
//        userHolder.person.userID = ""
//        userHolder.prayerList = ""
//        userHolder.prayStartDate = Date()
    }
    
    private func setInfo() async {
        // Fetch user information from your service
        // Handle errors and set userHolder properties accordingly
        
        do {
            userHolder.viewState = .loading
            defer { userHolder.viewState = .finished }
            
            let userID = Auth.auth().currentUser?.uid ?? ""
            userHolder.person = try await UserService().getBasicUserInfo(userID: userID)
            // This sets firstName, lastName, username, and userID for UserHolder
            
            // Turn on friend listener function. Enabled at start of app, and turned off when user exists app. Must exist throughout app active state so that if a friend is added when a user posts, it gets sent to all friends including new.
            try await friendRequestListener.setUpListener(userID: userHolder.person.userID)
        } catch {
            resetInfo()
            userHolder.isLoggedIn = .notAuthenticated
            ViewLogger.error("SignInView \(error)")
        }
    }
}

struct MyTextField: View {
    var placeholder: String = ""
    @Binding var text: String
    var textPrompt: String
    var textFieldType = ""
    
    var body: some View {
        if textFieldType == "text" {
            ZStack {
                TextField(placeholder, text: $text, prompt: Text(textPrompt))
                    .textInputAutocapitalization(.never)
                    .autocorrectionDisabled(true) // for constraint issue
                    .frame(height: 35)
                    .frame(maxWidth: .infinity)
                    .padding(.trailing, 40)
                Rectangle().foregroundStyle(.clear)
                    .frame(height: 35)
                
            }
        } else if textFieldType == "secure" {
            ZStack {
                SecureField(placeholder, text: $text, prompt: Text(textPrompt))
                    .textInputAutocapitalization(.never)
                    .autocorrectionDisabled(true) // for constraint issue
                    .frame(height: 35)
                    .frame(maxWidth: .infinity)
                    .padding(.trailing, 40)
                Rectangle().foregroundStyle(.clear)
                    .frame(height: 35)
            }
            
        }
    }
}

struct LoadingView: View {
    var body: some View {
        VStack {
            Spacer()
            Text("Flock").font(.largeTitle)
            Spacer()
        }
    }
}
