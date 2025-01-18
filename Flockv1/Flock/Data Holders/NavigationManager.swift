//
//  NavigationManager.swift
//  Flock
//
//  Created by Matt Lam on 11/6/24.
//

import Foundation
import SwiftUI

enum NavigationItem: Hashable {
    case post(Post)
    case person(Person)
    case updates(Post)
}

@Observable class NavigationManager {
    var path: NavigationPath = NavigationPath()
    
    func navigateTo(_ item: NavigationItem) {
        path.append(item)
    }
    
    // Method to reset the path if needed (e.g., for logout or exit)
    func resetPath() {
        path = NavigationPath()
    }
    
    // Navigation destination
    func navigationDestination(for item: NavigationItem) -> some View {
        switch item {
        case .post(let post):
            return AnyView(PostFullView(post: .constant(post)))
        case .person(let person):
            return AnyView(ProfileView(person: person))
        case .updates(let post):
            return AnyView(UpdateView(post: post))
        default:
            return AnyView(EmptyView()) // Provide an empty view for other cases - placeholder for empty.
        }
    }
}
