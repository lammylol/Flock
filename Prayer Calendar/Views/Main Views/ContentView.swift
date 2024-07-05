//
//  ContentView.swift
//  Prayer Calendar
//
//  Created by Matt Lam on 10/11/23.
//

import Foundation
import SwiftUI
import SwiftData

struct ContentView: View {
    @Environment(UserProfileHolder.self) var userHolder
    @Environment(DateHolder.self) var dateHolder
    @State var selection: Int
//    @State private var path: NavigationPath
    
    var body: some View {
        //Tabs for each view. Adds bottom icons.
        TabView(selection: $selection) {
            PrayerCalendarView()
                .tabItem {
                    Image(systemName: "house.fill")
                        .imageScale(.large)
                    Text("Calendar")
                }.tag(1)
            FeedView(person: userHolder.person)
                .tabItem {
                    Image(systemName: "newspaper.fill")
                        .imageScale(.large)
                    Text("Feed")
                }.tag(2)
            ProfileView(person: userHolder.person)
                .tabItem {
                    Image(systemName: "person.circle")
                        .imageScale(.large)
                    Text("Profile")
                }.tag(3)
        }
    }
}

// Screen Destinations for Navigation Path
extension ContentView {
    enum ScreenDestinations {
        case profile
        case feed
        case calendar
        
        @ViewBuilder func view(_path: Binding<NavigationPath>, person: Person) -> some View {
            switch self {
            case .calendar:
                PrayerCalendarView()
            case .feed:
                FeedView(person: person)
            case .profile:
                ProfileView(person: person)
            }
        }
    }
}
//
//#Preview("Content View") {
//    ContentView(selection: 1)
//        .environment(UserProfileHolder())
//}
