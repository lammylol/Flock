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
    @State private var showCreateContact: Bool = false
    @State private var showPending: Bool = true
    @State private var search: String = ""
    @State var friendsList: [Person] = []
    
    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading){
                    if !friendRequestListener.pendingFriendRequests.isEmpty {
                        VStack(alignment: .leading) { // Pending Requests
                            HStack {
                                Text("Pending Requests")
                                    .font(.title2)
                                Button {
                                    showPending.toggle()
                                } label: {
                                    if showPending {
                                        Image(systemName: "chevron.up")
                                    } else {
                                        Image(systemName: "chevron.up").rotationEffect(.degrees(180))
                                    }
                                }
                                Spacer()
                            }
                            if showPending {
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
                        if !friendRequestListener.pendingFriendRequests.isEmpty {
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
                            showPending = false
                            
                            if friendsList.isEmpty {
                                 friendsList = friendRequestListener.acceptedFriendRequests
                             } // stores an 'original' copy of the friends request to return to after the filter is removed.

                             if search.isEmpty {
                                 friendRequestListener.acceptedFriendRequests = friendsList
                             } else {
                                 friendRequestListener.acceptedFriendRequests = friendsList.filter { person in
                                     person.fullName.lowercased().contains(search.lowercased())
                                 }
                             }
                        }
                    }
                    .frame(maxWidth: .infinity)
                }
                .padding(.horizontal, 17)
                .overlay {
                    if friendRequestListener.acceptedFriendRequests.isEmpty {
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
                .padding(.bottom, 15)
            }
            .onAppear {
                friendRequestListener.setUpListener(userID: userHolder.person.userID)
            }
            .onDisappear {
                friendRequestListener.removeListener()
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
                AddFriendPage()
            }
            .navigationTitle("Friends")
            .navigationBarTitleDisplayMode(.automatic)
            .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .top)
        }
        .background(colorScheme == .dark ? .black : .white)
        .scrollContentBackground(.hidden)
    }
    
}

//#Preview {
//    FriendsPageView(friendsList: [Person.preview, Person.preview])
//}
