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
struct PrayerCalendarSwiftApp: App {
    
    init(){
        FirebaseApp.configure()
        print("Configured Firebase!")
    }
    
    var body: some Scene {
        WindowGroup {
            SignInView()
                .environment(UserProfileHolder())
                .environment(DateHolder())
                .environment(FeedViewModel())
        }
    }
}
