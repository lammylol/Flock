//
//  ProfileView.swift
//  PrayerCalendar
//
//  Created by Matt Lam on 10/6/23.
//
// Description: ProfileView with conditional statements changing the view depending on whether it is your profile you are viewing or someone else's.

import SwiftUI
import SwiftData
import FirebaseAuth
import FirebaseFirestore

struct ProfileView: View {
    @Environment(UserProfileHolder.self) var userHolder
    @Environment(\.colorScheme) var colorScheme
    
    @State private var showSubmit: Bool = false
    @State private var showEditView: Bool = false
    @State var person: Person
    @State private var viewModel: FeedViewModel = FeedViewModel(profileOrFeed: "profile")
    @State private var profileSettingsToggle: Bool = false
    @State private var navigationPath = NavigationPath()
    
    var userService = UserService()
    var friendService = FriendService()
    var friendHelper = FriendHelper()
    
    var body: some View {
        NavigationStack(path: $navigationPath) {
            ScrollView {
                VStack(alignment: .leading) {
                    VStack(alignment: .leading) {
                        Group {
                            if person.username == "" {
                                Text("@\(userHolder.person.username)")
                            } else {
                                Text("@\(person.username)")
                            }
                        }
                        .font(.system(size: 14))
                        .padding(.top, -8)
                        
                        Group {
                            // Button to show friend state. If friend state is pending, give option to approve or decline. Currently: Can't view a profile if you didn't add.
                            if person.friendState == "pending" {
                                Menu {
                                    Button {
                                        friendHelper.acceptFriendRequest(friendState: person.friendState, user: userHolder.person, friend: person)
                                    } label: {
                                        Text("Approve Friend Request")
                                    }
                                    Button {
                                        friendHelper.denyFriendRequest(friendState: person.friendState, user: userHolder.person, friend: person)
                                    } label: {
                                        Text("Dismiss Request")
                                    }
                                } label: {
                                    HStack {
                                        Text("Respond to Friend Request")
                                            .font(.system(size: 14))
                                            .bold()
                                        Image(systemName: "arrowtriangle.down.circle.fill")
                                            .foregroundStyle(.white)
                                            .imageScale(.small)
                                            .padding([.horizontal], -3)
                                    }
                                    .padding([.vertical], 5)
                                    .padding([.horizontal], 10)
                                }
                                .background {
                                    RoundedRectangle(cornerRadius: 5)
                                        .fill(.blue)
                                }
                                .foregroundStyle(.white)
                                .buttonStyle(PlainButtonStyle())
                            } else if person.friendState == "approved" {
                                HStack {
                                    Text("Friends")
                                        .font(.system(size: 14))
                                        .bold()
                                    Image(systemName: "checkmark.circle.fill")
                                        .foregroundStyle(.black)
                                        .imageScale(.small)
                                        .padding([.horizontal], -3)
                                }
                                .padding([.vertical], 5)
                                .padding([.horizontal], 10)
                                .background {
                                    RoundedRectangle(cornerRadius: 5)
                                        .fill(.gray)
                                        .opacity(0.30)
                                }
                            } else if !person.isPublic {
                                HStack {
                                    Text("Private")
                                        .font(.system(size: 14))
                                        .bold()
                                    Image(systemName: "lock.icloud.fill")
                                        .foregroundStyle(.black)
                                        .imageScale(.small)
                                        .padding([.horizontal], -3)
                                }
                                .padding([.vertical], 5)
                                .padding([.horizontal], 10)
                                .background {
                                    RoundedRectangle(cornerRadius: 5)
                                        .fill(.gray)
                                        .opacity(0.30)
                                }
                            }
                        }
                        .padding(.top, 3)
                    }
                    .padding([.leading, .trailing], 20)
                    
                    Spacer()
                    
                    LazyVStack {
                        HStack{
                            // Only show this if you are the owner of profile.
                            if person.username == userHolder.person.username {
                                Text("My Posts")
                                    .font(.title3)
                                    .bold()
                                    .frame(maxWidth: .infinity, alignment: .leading)
                                    .padding(.leading, 20)
                            } else {
                                Text("\(person.firstName)'s Posts")
                                    .font(.title3)
                                    .bold()
                                    .frame(maxWidth: .infinity, alignment: .leading)
                                    .padding(.leading, 20)
                            }
                            Spacer()
                            
                            HStack {
                                if viewModel.selectedStatus == .noLongerNeeded {
                                    Text("No Longer\nNeeded")
                                        .font(.system(size: 14))
                                        .multilineTextAlignment(.trailing)
                                } else {
                                    Text(viewModel.selectedStatus.rawValue.capitalized)
                                        .font(.system(size: 16))
                                        .multilineTextAlignment(.trailing)
                                }
                                
                                StatusPicker(viewModel: viewModel)
                                    .onChange(of: viewModel.selectedStatus, {
                                        Task {
                                            if !viewModel.isFetching || !viewModel.isLoading {
                                                await viewModel.getPrayerRequests(user: userHolder.person, person: person)
                                            }
                                        }
                                    })
                            }
                            .padding(.trailing, 20)
                        }
                        Divider()
                        PostsFeed(viewModel: viewModel, person: person, profileOrFeed: "profile")
                    }
                    .padding(.top, 10)
                }
            }
            .task {
                do {
                    self.person = try await userService.retrieveUserInfoFromUsername(person: person, userHolder: userHolder)
                } catch {
                    print(error)
                }
            }
            .refreshable {
                Task {
                    if viewModel.isFinished {
                        await viewModel.getPrayerRequests(user: userHolder.person, person: person)
                    }
                }
            }
            .navigationTitle(person.firstName + " " + person.lastName)
            .navigationBarTitleDisplayMode(.large)
            .sheet(isPresented: $showSubmit, onDismiss: {
                Task {
                    do {
                        if viewModel.prayerRequests.isEmpty || userHolder.refresh == true {
                            self.person = try await userService.retrieveUserInfoFromUsername(person: person, userHolder: userHolder) // retrieve the userID from the username submitted only if username is not your own. Will return user's userID if there is a valid username. If not, will return user's own.
                            await viewModel.getPrayerRequests(user: userHolder.person, person: person)
                        } else {
                            self.viewModel.prayerRequests = viewModel.prayerRequests
                            //                            self.height = height
                        }
                        print("Success retrieving prayer requests for \(person.userID)")
                    }
                }
            }, content: {
                SubmitPostForm(person: person)
            })
            .toolbar {
                // Only show this if the account has been created under your userID. Aka, can be your profile or another that you have created for someone.
                if person.userID == userHolder.person.userID {
                    ToolbarItem(placement: .topBarTrailing) {
                        if person.username == userHolder.person.username {
                            HStack {
                                Button(action: {
                                    navigationPath.append("settings")
                                }) {
                                    Image(systemName: "gear")
                                }
                            }
                            // temporary fix for Navigation Link not working.
                            .padding(.trailing, -18)
                            .padding(.top, 3)
                        }
                    }
                    ToolbarItem(placement: .topBarTrailing) {
                        HStack {
                            Button(action: {
                                showSubmit.toggle()
                            }) {
                                Image(systemName: "square.and.pencil")
                            }
                        }
                    }
                }
            }
            .navigationDestination(for: String.self) { value in
                if value == "settings" {
                    ProfileSettingsView()
                }
            }
        }
    }
    
    func usernameDisplay() -> String {
        if person.username == "" {
            return "private profile"
        }
        return "@\(person.username.capitalized)"
    }
}

//#Preview {
//    ProfileView(person: Person(userID: "aMq0YdteGEbYXWlSgxehVy7Fyrl2", username: "lammylol"))
//        .environment(UserProfileHolder())
//}
