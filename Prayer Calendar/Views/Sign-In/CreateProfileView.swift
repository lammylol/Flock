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
    
    @Environment(\.dismiss) var dismiss
    @State var email = ""
    @State var password = ""
    @State var username = ""
    @State var firstName = ""
    @State var lastName = ""
    @State var errorMessage = ""
    
    var body: some View {
        NavigationView{
            VStack(/*spacing: 20*/) {
                Text("Create an Account")
                    .font(.largeTitle)
                    .bold()
                    .offset(x: 0, y: 0)
                
                HStack {
                    Text("First Name: ")
                        .padding(.leading, 40)
                    MyTextView(placeholder: "", text: $firstName, textPrompt: "first name", textFieldType: "text")
                }
                
                Rectangle()
                    .frame(height: 1)
                    .padding([.leading, .trailing], 40)
                
                HStack {
                    Text("Last Name: ")
                        .padding(.leading, 40)
                    MyTextView(placeholder: "", text: $lastName, textPrompt: "last name", textFieldType: "text")
                }
                
                Rectangle()
                    .frame(height: 1)
                    .padding([.leading, .trailing], 40)
                
                HStack {
                    Text("Email: ")
                        .padding(.leading, 40)
                    MyTextView(placeholder: "", text: $email, textPrompt: "enter email", textFieldType: "text")
                }
                
                Rectangle()
                    .frame(height: 1)
                    .padding([.leading, .trailing], 40)
                
                HStack {
                    Text("Username: ")
                        .padding(.leading, 40)
                    MyTextView(placeholder: "", text: $username, textPrompt: "enter username", textFieldType: "text")
                }
                
                Rectangle()
                    .frame(height: 1)
                    .padding([.leading, .trailing], 40)
                
                HStack {
                    Text("Password: ")
                        .padding(.leading, 40)
                    MyTextView(placeholder: "", text: $password, textPrompt: "enter password", textFieldType: "secure")
                }
                
                Rectangle()
                    .frame(height: 1)
                    .padding([.leading, .trailing], 40)
            
                Button(action: {
                    self.createAccount()
                }) {Text("Create Account")
                        .bold()
                        .frame(width: 150, height: 35)
                }
                .background(
                    RoundedRectangle(cornerRadius: 5)
                        .fill(.blue)
                )
                .foregroundStyle(.white)
                .padding([.top, .bottom], 15)
                
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
            if await PrayerPersonHelper().checkIfUsernameExists(username: username) == true {
                errorMessage = "Username already taken by an existing account. Please enter try a different username."
            }
            // Ensure username does not have special characters. This will affect assessment of 'username' or 'name' in prayerNameInputView().
            else if specialCharacterTest(username: username) {
                errorMessage = "Username cannot contain special characters. Please enter a new username."
                print("Username cannot contain special characters. Please submit a new username.")
            } 
            
            // Task to set data.
            else {
                Auth.auth().createUser(withEmail: email, password: password) { result, error in
                    
                    if error != nil {
                        errorMessage = error!.localizedDescription
                        print(error!.localizedDescription.localizedLowercase)
                    } else {
                            
                        let userID = result?.user.uid
                        print("userID: " + (userID ?? ""))
                        
                        let db = Firestore.firestore()
                        let ref = db.collection("users").document("\(userID ?? "")")
                        
                        ref.setData(
                            ["email": email,
                             "userID": userID ?? "",
                             "username": username.lowercased(),
                             "firstName": firstName.capitalized,
                             "lastName": lastName.capitalized]
                        )
                        
                        let ref2 = db.collection("usernames").document("\(username)")
                        
                        ref2.setData(
                            ["username": username.lowercased(),
                             "userID": userID ?? "",
                             "firstName": firstName,
                             "lastName": lastName]
                        )
                        
                        print("Account successfully created.")
                        dismiss()
                        errorMessage = ""
                    }
                }
            }
        }
    }
}

#Preview {
    CreateProfileView()
}
