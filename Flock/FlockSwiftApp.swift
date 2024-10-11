//
//  PrayerCalendarSwiftApp.swift
//  PrayerCalendarSwift
//
//  Created by Matt Lam on 9/25/23.
//
import SwiftUI
import SwiftData
import FirebaseCore

@main
struct FlockApp: App {
    @State private var friendRequestListener = FriendRequestListener()
    @StateObject var authViewModel = AuthViewModel()
    
    @UIApplicationDelegateAdaptor(AppDelegate.self) var appDelegate
    
    var body: some Scene {
        WindowGroup {
            SignInView()
                .environment(UserProfileHolder())
                .environment(DateHolder())
                .environment(FeedViewModel())
                .environment(friendRequestListener)
        }
    }
}
