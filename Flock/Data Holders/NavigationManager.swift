//
//  NavigationManager.swift
//  Flock
//
//  Created by Matt Lam on 11/6/24.
//

import Foundation
import SwiftUI

@Observable class NavigationManager {
    var path: NavigationPath = NavigationPath()
    
    // Method to navigate to ProfileView
    func navigateToPost(with post: Post) {
        path.append(post) // Append `Person` to the path to pass it to ProfileView
    }
    
    // Method to navigate to ProfileView
    func navigateToProfile(with person: Person) {
        path.append(person) // Append `Person` to the path to pass it to ProfileView
    }
    
    // Method to reset the path if needed (e.g., for logout or exit)
    func resetPath() {
        path = NavigationPath()
    }
}
