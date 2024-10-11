//
//  ForgotPassword.swift
//  Prayer Calendar
//
//  Created by Matt Lam on 3/3/24.
//

import SwiftUI
import FirebaseAuth

struct ForgotPassword: View {
    @State var email = ""
    @State var errorMessage = ""
    @State var successMessage = ""
    @Environment(\.dismiss) var dismiss
    
    var body: some View {
        NavigationView{
            VStack(/*spacing: 20*/) {
                Spacer()
                
                VStack(alignment: .leading) {
                    HStack {
                        Text("Forgot Password?")
                            .font(.title)
                            .bold()
                        Spacer()
                    }
                    .padding(.bottom, 7)
                    
                    HStack {
                        Text("A password reset link will be sent to the email provided.")
                            .font(.system(size: 16))
                        Spacer()
                    }
                }
                .padding([.leading, .trailing], 40)
                .padding(.bottom, 15)
                
                Rectangle()
                    .frame(height: 1)
                    .padding([.leading, .trailing], 40)
                
                HStack {
                    Text("Email: ")
                    MyTextField(placeholder: "", text: $email, textPrompt: "email", textFieldType: "text")
                        .textContentType(.emailAddress)
                }
                .padding([.leading, .trailing], 40)
                
                Rectangle()
                    .frame(height: 1)
                    .padding([.leading, .trailing], 40)
                
                Button(action: {
                    self.resetPassword()
                }) {Text("Send")
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
                
                if errorMessage != "" {
                    Text(errorMessage)
                        .font(.system(size: 16))
                        .foregroundStyle(Color.red)
                        .padding([.leading, .trailing], 40)
                        .padding(.bottom, 15)
                }
                
                if successMessage != "" {
                    Text(successMessage)
                        .font(.system(size: 16))
                        .foregroundStyle(Color.blue)
                        .padding([.leading, .trailing], 40)
                        .padding(.bottom, 15)
                }
                
                VStack {
                    Text("Has your password been reset already? ")
                    Button(action: {
                        dismiss()
                        successMessage = ""
                    }) {
                        Text("Sign In")
                    }
                }
                .padding([.bottom], 15)
                
                Spacer()
            }
            .toolbar {
                ToolbarItemGroup(placement: .topBarLeading) {
                    Button("Cancel") {
                        dismiss()
                        successMessage = ""
                    }
                }
            }
            .navigationBarBackButtonHidden(true)
        }
    }
    
    func resetPassword() {
        Auth.auth().sendPasswordReset(withEmail: email) { error in
            if error != nil {
                errorMessage = error!.localizedDescription
                ViewLogger.error("reset password error: \(errorMessage)")
            } else {
                successMessage = "A link to reset password has been sent to your email!"
                errorMessage = ""
            }
        }
    }

}

#Preview {
    ForgotPassword()
}
