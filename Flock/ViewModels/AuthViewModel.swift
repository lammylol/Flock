//
//  AuthViewModel.swift
//  Flock
//
//  Created by Preston Mar on 10/10/24.
//

// ViewModels/AuthViewModel.swift
import SwiftUI
import FirebaseAuth

class AuthViewModel: ObservableObject {
    @Published var isAuthenticated = false
    
    init() {
        self.isAuthenticated = Auth.auth().currentUser != nil
    }
    
    func signIn(email: String, password: String) {
        Auth.auth().signIn(withEmail: email, password: password) { [weak self] result, error in
            if let error = error {
                print("Error signing in: \(error.localizedDescription)")
            } else {
                self?.isAuthenticated = true
            }
        }
    }
    
    func signOut() {
        do {
            try Auth.auth().signOut()
            isAuthenticated = false
        } catch {
            print("Error signing out: \(error.localizedDescription)")
        }
    }
}
