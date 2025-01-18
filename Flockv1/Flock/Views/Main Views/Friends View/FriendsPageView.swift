//
//  FriendsPageView.swift
//  Flock
//
//  Created by Matt Lam on 7/30/24.
//

import SwiftUI

struct FriendsPageView: View {
    @Environment(UserProfileHolder.self) var userHolder
    @Environment(FriendRequestListener.self) var friendRequestListener
    @Environment(\.colorScheme) var colorScheme
    
    var friendService = FriendService()
    @State private var showAddFriend: Bool = false
    @State private var showPendingExpand: Bool = true // Variable to expand and contract pending friends list
    @State private var search: String = ""
    @State private var showCreateorAddFriend: Bool = false // Variable to add / create friend on search.
    @State var friendsList: [Person] = []
    
    private var showDuringSearch: Bool {
        if search.isEmpty {
            return false
        } else {
            return true
        }
    } // Variable to show pending "title" and section.
    
    // Filtered Friends Based on Search Query
    var filteredPublicFriends: [Person] {
        if search.isEmpty {
            return friendRequestListener.acceptedFriendRequests
        } else {
            return friendRequestListener.acceptedFriendRequests.filter { $0.firstName.lowercased().contains(search.lowercased()) || $0.lastName.lowercased().contains(search.lowercased()) }
        }
    }
    
    var filteredPrivateFriends: [Person] {
        if search.isEmpty {
            return friendRequestListener.privateFriends
        } else {
            return friendRequestListener.privateFriends.filter { $0.firstName.lowercased().contains(search.lowercased()) || $0.lastName.lowercased().contains(search.lowercased()) }
        }
    }
    
    var body: some View {
        ScrollView {
            VStack(alignment: .leading){
                if showDuringSearch {
                    Button {
                        showAddFriend.toggle()
                    } label: {
                        Label("Add '\(search)' as a friend", systemImage: "person.fill.badge.plus")
                            .foregroundStyle(Color.primary)
                    }
                    .padding(.vertical, 5)
                    .padding(.leading, 3)
                }
                
                if !friendRequestListener.pendingFriendRequests.isEmpty && !showDuringSearch {
                    VStack(alignment: .leading) { // Pending Requests
                        HStack {
                            Text("Pending Requests")
                                .font(.title2)
                            Button {
                                showPendingExpand.toggle()
                            } label: {
                                if showPendingExpand {
                                    Image(systemName: "chevron.up")
                                } else {
                                    Image(systemName: "chevron.up").rotationEffect(.degrees(180))
                                }
                            }
                            Spacer()
                        }
                        if showPendingExpand {
                            ForEach(friendRequestListener.pendingFriendRequests) { friend in
                                ContactRow(person: friend)
                                    .frame(maxWidth: .infinity)
                            }
                        }
                    }
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 15)
                }
                    
                VStack(alignment: .leading) { // Friends
                    if !filteredPublicFriends.isEmpty && !showDuringSearch {
                        HStack {
                            Text("Public Friends")
                                .font(.title2)
                            Spacer()
                        }
                    }
                    ForEach(filteredPublicFriends) { friend in
                            ContactRow(person: friend)
                            .frame(maxWidth: .infinity)
                    }
                    .textInputAutocapitalization(.never)
                }
                .frame(maxWidth: .infinity)
                
                VStack(alignment: .leading) { // Friends
                    if !filteredPrivateFriends.isEmpty && !showDuringSearch {
                        HStack {
                            Text("Private Friends")
                                .font(.title2)
                            Spacer()
                        }
                    }
                    ForEach(filteredPrivateFriends) { friend in
                            ContactRow(person: friend)
                            .frame(maxWidth: .infinity)
                    }
                    .textInputAutocapitalization(.never)
                }
                .frame(maxWidth: .infinity)
                .padding(.vertical, 15)
            }
            .searchable(text: $search, placement: .navigationBarDrawer(displayMode: .always), prompt: "Search friends")
            .overlay {
                if friendRequestListener.acceptedFriendRequests.isEmpty && friendRequestListener.pendingFriendRequests.isEmpty && friendRequestListener.privateFriends.isEmpty {
                        VStack{
                            ContentUnavailableView {
                                Label("No Friends...Yet!", systemImage: "person.crop.square")
                            } description: {
                                Text("It looks like you haven't added any friends yet. That's okay, we'll help you add one.")
                                    .font(.system(size: 16))
                            } actions: {
                                Button(action: {showAddFriend.toggle() })
                                {
                                    Text("Add Friend")
                                        .font(.system(size: 18))
                                }
                            }
                            .frame(height: 500)
                            .offset(y: 120)
                            Spacer()
                        }
                }
            }
            .padding(.horizontal, 17)
            .padding(.bottom, 15)
        }
        .sheet(isPresented: $showAddFriend) {
            AddFriendPage(preName: search)
        }
        .refreshable(action: {
            Task {
                do {
                    let friends = try await friendService.getFriendsList(userID: userHolder.person.userID)
                    friendRequestListener.acceptedFriendRequests = friends.0
                    friendRequestListener.pendingFriendRequests = friends.1
                } catch {
                    ViewLogger.error("FriendsPageView \(error)")
                }
            }
        })
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .top)
        .navigationTitle("Friends")
        .navigationBarTitleDisplayMode(.large)
        .toolbar {
            frieldToolbar
        }
        .background(.windowBackground)
        .scrollContentBackground(.hidden)
    }
    
    private var frieldToolbar: some ToolbarContent {
        Group {
            ToolbarItem(placement: .topBarLeading) {
                HStack {
                    if buildConfiguration == DEVELOPMENT {
                        Text("DEVELOPMENT")
                            .font(.title2)
                            .bold()
                            .padding(.leading, 10) // Moved padding here
                    }
                }
                .frame(maxWidth: .infinity) // Moved the frame modifier here
            }
            
            ToolbarItem(placement: .topBarTrailing) {
                Button {
                    showAddFriend.toggle()
                } label: {
                    Image(systemName: "plus.circle")
                }
            }
        }
    }
}

//#Preview {
//    FriendsPageView(friendsList: [Person.preview, Person.preview])
//}
