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
    @State private var userProfileHolder = UserProfileHolder()
    @State private var feedViewModel = FeedViewModel()
    @State private var uiSizing = UISizing()
    @State private var dateHolder = DateHolder()
    
    @UIApplicationDelegateAdaptor(AppDelegate.self) var appDelegate
    
    var body: some Scene {
        WindowGroup {
            SignInView()
                .environment(userProfileHolder)
                .environment(dateHolder)
                .environment(feedViewModel)
                .environment(friendRequestListener)
                .environment(uiSizing)
        }
    }
}
