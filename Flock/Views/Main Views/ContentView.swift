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
    @Environment(FriendRequestListener.self) var friendRequestListener
    @Environment(\.scenePhase) var scenePhase
    @State var selection: Int
    
    var body: some View {
        
        //Tabs for each view. Adds bottom icons.
        TabView(selection: $selection) {
            TodayView()
                .tabItem {
                    Image(systemName: "house.fill")
                        .imageScale(.large)
                    Text("Home")
                }
                .tag(1)
            FeedView()
                .tabItem {
                    Image(systemName: "newspaper.fill")
                        .imageScale(.large)
                    Text("Feed")
                }
                .tag(2)
            
            FriendsPageView()
                .tabItem {
                    Image(systemName: "person.2.fill")
                        .imageScale(.large)
                    Text("Friends")
                }
                .tag(3)
            ProfileView(person: userHolder.person)
                .tabItem {
                    Image(systemName: "person.circle")
                        .imageScale(.large)
                    Text("Profile")
                }
                .tag(4)
        }
        .onChange(of: scenePhase) {
            oldPhase, newPhase in
            if newPhase == .active {
                Task {
                    do {
                        try await friendRequestListener.setUpListener(userID: userHolder.person.userID)
                    } catch {
                        ViewLogger.error("ContentView: friendRequestListener \(error)")
                    }
                }
            } else if newPhase == .inactive {
                friendRequestListener.removeListener()
            } else if newPhase == .background {
                friendRequestListener.removeListener()
            }
        } // detect when app is closed or open.
    }
}
