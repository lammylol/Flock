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
    @State private var showDuringSearch: Bool = false // Variable to show pending "title" and section.
    @State private var search: String = ""
    @State private var showCreateorAddFriend: Bool = false // Variable to add / create friend on search.
    @State var friendsList: [Person] = []
    
//    @State var newFriendFirstName: String = ""
//    @State var newFriendLastName: String = ""
    
    var body: some View {
        NavigationStack {
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
                        if !friendRequestListener.pendingFriendRequests.isEmpty && !friendRequestListener.acceptedFriendRequests.isEmpty {
                            HStack {
                                Text("Friends")
                                    .font(.title2)
                                Spacer()
                            }
                        }
                        ForEach(friendRequestListener.acceptedFriendRequests) { friend in
                                ContactRow(person: friend)
                                .frame(maxWidth: .infinity)
                        }
                        .searchable(text: $search, placement: .navigationBarDrawer(displayMode: .always), prompt: "Search friends")
                        .textInputAutocapitalization(.never)
                        .onChange(of: search) {
                            showDuringSearch = true
                            
                            if friendsList.isEmpty {
                                 friendsList = friendRequestListener.acceptedFriendRequests
                             } // stores an 'original' copy of the friends request to return to after the filter is removed.

                             if search.isEmpty {
                                 friendRequestListener.acceptedFriendRequests = friendsList
                                 showDuringSearch = false
                             } else {
                                 friendRequestListener.acceptedFriendRequests = friendsList.filter { person in
                                     person.fullName.lowercased().contains(search.lowercased())
                                 }
                             }
                        }
                    }
                    .frame(maxWidth: .infinity)
                }
                .overlay {
                    if friendRequestListener.acceptedFriendRequests.isEmpty && friendRequestListener.pendingFriendRequests.isEmpty {
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
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button {
                        showAddFriend.toggle()
                    } label: {
                        Image(systemName: "plus.circle")
                    }
                }
            }
            .sheet(isPresented: $showAddFriend) {
                AddFriendPage(preName: search)
            }
            .navigationTitle("Friends")
            .navigationBarTitleDisplayMode(.automatic)
            .refreshable(action: {
                Task {
                    do {
                        let friends = try await friendService.getFriendsList(userID: userHolder.person.userID)
                        friendRequestListener.acceptedFriendRequests = friends.0
                        friendRequestListener.pendingFriendRequests = friends.1
                    } catch {
                        print(error)
                    }
                }
            })
            .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .top)
        }
        .background(colorScheme == .dark ? .black : .white)
        .scrollContentBackground(.hidden)
    }
    
}

//#Preview {
//    FriendsPageView(friendsList: [Person.preview, Person.preview])
//}
