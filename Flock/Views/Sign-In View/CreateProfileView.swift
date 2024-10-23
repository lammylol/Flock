//
//  CreateProfileView.swift
//  Prayer Calendar
//
//  Created by Matt Lam on 12/3/23.
//

import SwiftUI
import FirebaseFirestore
import FirebaseAuth

struct CreateProfileView: View {
    @Environment(UserProfileHolder.self) var userHolder
    @Environment(\.dismiss) var dismiss
    @Environment(FriendRequestListener.self) var friendRequestListener
    
    @State var email = ""
    @State var password = ""
    @State var username = ""
    @State var firstName = ""
    @State var lastName = ""
    @State var errorMessage = ""
    
    let userService = UserService()
    let calendarService = CalendarService()
    
    var body: some View {
        NavigationView{
            VStack(/*spacing: 20*/) {
                Spacer()
                
                HStack {
                    Text("Create Account")
                        .font(.title)
                        .bold()
                        .padding(.trailing, 60)
                    Spacer()
                }
                .padding([.leading, .trailing], 40)
                
                HStack {
                    Text("First Name: ")
                        .padding(.leading, 40)
                    MyTextField(placeholder: "", text: $firstName, textPrompt: "first name", textFieldType: "text")
                }
                
                Rectangle()
                    .frame(height: 1)
                    .padding([.leading, .trailing], 40)
                
                HStack {
                    Text("Last Name: ")
                        .padding(.leading, 40)
                    MyTextField(placeholder: "", text: $lastName, textPrompt: "last name", textFieldType: "text")
                }
                
                Rectangle()
                    .frame(height: 1)
                    .padding([.leading, .trailing], 40)
                
                HStack {
                    Text("Email: ")
                        .padding(.leading, 40)
                    MyTextField(placeholder: "", text: $email, textPrompt: "enter email", textFieldType: "text").textContentType(.emailAddress)
                }
                
                Rectangle()
                    .frame(height: 1)
                    .padding([.leading, .trailing], 40)
                
                HStack {
                    Text("Username: ")
                        .padding(.leading, 40)
                    MyTextField(placeholder: "", text: $username, textPrompt: "enter username", textFieldType: "text")
                }
                
                Rectangle()
                    .frame(height: 1)
                    .padding([.leading, .trailing], 40)
                
                HStack {
                    Text("Password: ")
                        .padding(.leading, 40)
                    MyTextField(placeholder: "", text: $password, textPrompt: "enter password", textFieldType: "secure").textContentType(.password)
                }
                
                Rectangle()
                    .frame(height: 1)
                    .padding([.leading, .trailing], 40)
            
                Button(action: {
                    self.createAccount()
                }) {Text("Create Account")
                        .bold()
                        .frame(height: 35)
                        .frame(maxWidth: .infinity)
                }
                .background(
                    RoundedRectangle(cornerRadius: 5)
                        .fill(.blue)
                )
                .foregroundStyle(.white)
                .padding([.top, .bottom], 15)
                .padding([.leading, .trailing], 40)
                
                Text(errorMessage)
                    .font(.system(size: 16))
                    .foregroundStyle(Color.red)
                    .padding([.leading, .trailing], 40)
                
                Spacer()

            }
            .toolbar {
                ToolbarItemGroup(placement: .topBarLeading) {
                    Button("Cancel") {
                        dismiss()
                    }
                }
            }
            .navigationBarBackButtonHidden(true)
        }
    }
    
    //Scans for special characters in username.
    func specialCharacterTest(username: String) -> Bool {
        return username.range(of: "[ !\"#$%&'()*+,-./:;<=>?@\\[\\\\\\]^_`{|}~]+", options: .regularExpression) != nil
    }
    
    func createAccount() {
        Task {
            // Ensure username does not exist.
            if await userService.checkIfUsernameExists(username: username) == true {
                errorMessage = "Username already taken by an existing account. Please enter try a different username."
            }
            // Ensure username does not have special characters. This will affect assessment of 'username' or 'name' in prayerNameInputView().
            else if specialCharacterTest(username: username) {
                errorMessage = "Username cannot contain special characters. Please enter a new username."
            }
            
            // Task to set data.
            else {
                Auth.auth().createUser(withEmail: email, password: password) { result, error in
                    
                    if error != nil {
                        errorMessage = error!.localizedDescription
                        ViewLogger.error("CreateProfileViews create profile error: \(error)")
                    } else {
                        Task {
                            userHolder.viewState = .loading
                            defer { userHolder.viewState = .finished }
                            
                            do {
                                let userID = result?.user.uid
                                
                                let db = Firestore.firestore()
                                let ref = db.collection("users").document("\(userID ?? "")")
                                
                                try await ref.setData(
                                    ["email": email,
                                     "userID": userID ?? "",
                                     "username": username.lowercased(),
                                     "firstName": firstName.lowercased(),
                                     "lastName": lastName.lowercased()]
                                )
                                
                                let refUsernames = db.collection("usernames").document("\(username)")
                                try await refUsernames.setData(
                                    ["userID": userID ?? "",
                                     "username": username.lowercased()]
                                )
                                
                                ViewLogger.info("Account successfully created.")
                                await setInfo()
                                errorMessage = ""
                                
                                // DispatchQueue ensures that dismiss happens on the main thread.
                                DispatchQueue.main.async {
                                    dismiss()
                                }
                            } catch {
                                ViewLogger.error("CreateProfileView \(error)")
                            }
                        }
                    }
                }
            }
        }
    }
    
    func setInfo() async {
        let userID = Auth.auth().currentUser?.uid ?? ""
        
        do {
            userHolder.person = try await UserService().getBasicUserInfo(userID: userID)
            // This sets firstName, lastName, username, and userID for UserHolder
            let postList = try await calendarService.getPrayerCalendarList(userID: userID)
            userHolder.prayStartDate = postList.0 // set Start Date
            userHolder.prayerList = postList.1 // set Prayer List
            
            try await createFriendsListandSetUpListener(userID: userID)
            self.userHolder.person = userHolder.person
        } catch {
            userHolder.isLoggedIn = .notAuthenticated
        }
    }
    
    func createFriendsListandSetUpListener(userID: String) async throws {
        Task {
//            let db = Firestore.firestore()
//            
//            // Ensure the friendsList collection is created
//            let userRef = db.collection("users").document(userID).collection("friendsList")
//            
//            // Add an empty initial document if needed
//            let initialData: [String: Any] = ["state": "initialized"]
//            try await userRef.document("initialFriendList").setData(initialData)
            
            //set up listener
            try await friendRequestListener.setUpListener(userID: userID)
        }
    }
}

#Preview {
    CreateProfileView()
}
