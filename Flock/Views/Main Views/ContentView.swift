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
    @Environment(UserProfileHolder.self) private var userHolder
    @Environment(DateHolder.self) private var dateHolder
    @Environment(FriendRequestListener.self) private var friendRequestListener
    @Environment(\.scenePhase) private var scenePhase
    @Environment(NavigationManager.self) private var navigationManager
    @State var selection: Int
    @State var path = NavigationPath()
    
    var body: some View {
        TabView(selection: $selection) {
            NavigationStack(path: $path) {
                //Tabs for each view. Adds bottom icons.
                TodayView()
                    .navigationDestination(for: NavigationItem.self) {
                        item in navigationManager.navigationDestination(for: item)
                    }
                    .task {
                        navigationManager.resetPath()
                    }
            }
            .tabItem {
                Image(systemName: "house.fill")
                    .imageScale(.large)
                Text("Home")
            }
            .tag(1)
            
            NavigationStack(path: $path) {
                //Tabs for each view. Adds bottom icons.
                FeedView()
                    .navigationDestination(for: NavigationItem.self) {
                        item in navigationManager.navigationDestination(for: item)
                    }
                    .task {
                        navigationManager.resetPath()
                    }
            }
            .tabItem {
                Image(systemName: "newspaper.fill")
                    .imageScale(.large)
                Text("Feed")
            }
            .tag(2)
            
            NavigationStack(path: $path) {
                //Tabs for each view. Adds bottom icons.
                FriendsPageView()
                    .navigationDestination(for: NavigationItem.self) {
                        item in navigationManager.navigationDestination(for: item)
                    }
                    .task {
                        navigationManager.resetPath()
                    }
            }
            .tabItem {
                Image(systemName: "person.2.fill")
                    .imageScale(.large)
                Text("Friends")
            }
            .tag(3)
            
            NavigationStack(path: $path) {
                //Tabs for each view. Adds bottom icons.
                ProfileView(person: userHolder.person)
                    .navigationDestination(for: NavigationItem.self) {
                        item in navigationManager.navigationDestination(for: item)
                    }
            }
            .tabItem {
                Image(systemName: "person.circle")
                    .imageScale(.large)
                Text("Profile")
            }
            .tag(4)
        }
        .onChange(of: navigationManager.path) {
            oldPath, newPath in
            self.path = newPath
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
