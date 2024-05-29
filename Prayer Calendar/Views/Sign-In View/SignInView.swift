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
    @Environment(DateHolder.self) var dateHolder
    @Environment(\.colorScheme) var colorScheme
    @State var email = ""
    @State var username = ""
    @State var password = ""
    @State var showCreateAccount: Bool = false
    @State var showForgotPassword: Bool = false
    @State var errorMessage = ""
    @State var text: String = ""
    @State var passwordText: String = ""
    @State private var height: CGFloat = 0
    
    var body: some View {
        Group {
            if userHolder.isLoading {
                VStack {
                    Spacer()
                    Text("Prayer Calendar")
                        .font(.largeTitle)
                        .multilineTextAlignment(.center)
                    Spacer()
                }
            } else if userHolder.isLoggedIn == .authenticated && userHolder.isFinished {
                ContentView(selection: 1)
            } else {
                NavigationView {
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
                                        MyTextView(placeholder: "", text: $email, textPrompt: "enter email", textFieldType: "text")
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
                                        MyTextView(placeholder: "", text: $password, textPrompt: "enter password", textFieldType: "secure")
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
                }.navigationViewStyle(.stack)
            }
        }
        .task {
            userHolder.viewState = .loading
            defer { userHolder.viewState = .finished }
            
            dateHolder.date = Date() // Resets the view to current month
            if userHolder.isLoggedIn == .authenticated {
                let userID = Auth.auth().currentUser?.uid ?? ""
                await PrayerPersonHelper().getUserInfo(person: Person(userID: userID), userHolder: userHolder)
                await PrayerPersonHelper().getPrayerList(userHolder: userHolder)
            }
        }
    }
    
    func signIn() {
        Task {
//            userHolder.viewState = .loading
//            defer { userHolder.viewState = .finished }
//            
            Auth.auth().signIn(withEmail: email, password: password) { result, error in
                if let error = error {
                    let err = error as NSError
                    if let authErrorCode = AuthErrorCode.Code(rawValue: err.code) {
                        
                        switch authErrorCode {
                        case .userNotFound:
                            errorMessage = "No account found with these credentials."
                        case .wrongPassword:
                            errorMessage = "Incorrect password entered. Please try again."
                        case .invalidEmail:
                            errorMessage = "Invalid email entered. Please enter a valid email."
                        case .networkError:
                            errorMessage = "A network error has occurred. Please try again later."
                        default:
                            errorMessage = "Invalid Credentials."
                        }
                    }
                    print(errorMessage)
                } else {
                    Task {
                        userHolder.viewState = .loading
                        defer { userHolder.viewState = .finished }
                        
//                        let userID = Auth.auth().currentUser!.uid
                        userHolder.email = email
                        userHolder.userPassword = password
                        
                        let userID = Auth.auth().currentUser?.uid ?? ""
                        await PrayerPersonHelper().getUserInfo(person: Person(userID: userID), userHolder: userHolder)
                        await PrayerPersonHelper().getPrayerList(userHolder: userHolder)
                        
                        email = ""
                        password = ""
                        username = ""
                        errorMessage = ""
                    }
                }
            }
        }
    }
}


struct MyTextView: View {
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

#Preview {
    SignInView()
        .environment(UserProfileHolder())
}
