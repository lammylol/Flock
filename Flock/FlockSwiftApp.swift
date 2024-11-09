//
//  FlockApp.swift
//  FlockSwift
//
//  Created by Matt Lam on 9/25/23.
//
import SwiftUI
import SwiftData
import FirebaseCore

@main
struct FlockApp: App {
    @UIApplicationDelegateAdaptor(AppDelegate.self) var appDelegate

    var body: some Scene {
        WindowGroup {
            SignInView()
                .environment(UserProfileHolder())
                .environment(FriendRequestListener())
                .environment(DateHolder())
                .environment(FeedViewModel())
                .environment(UISizing())
                .environment(NavigationManager())
        }
    }
}
