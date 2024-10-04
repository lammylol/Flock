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
    @State private var friendText: String = ""
    @State private var addFriendConfirmation: Bool = false
    
    var userService = UserService()
    var friendService = FriendService()
    var friendHelper = FriendHelper()
    
    var body: some View {
        NavigationStack(path: $navigationPath) {
            ZStack {
//                (colorScheme == .light ? Color(.systemGray6) : .clear)
//                    .ignoresSafeArea()
                 // sets background color.
                
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
                            
                            if !userHolder.profileViewIsLoading {
                                Group {
                                    // Button to show friend state. If friend state is pending, give option to approve or decline. Currently: Can't view a profile if you didn't add.
                                    if person.friendState == "pending" {
                                        Menu {
                                            Button {
                                                acceptFriendRequest()
                                            } label: {
                                                Label("Approve Request", systemImage: "person.crop.circle.badge.plus")
                                            }
                                            Button {
                                                dismissFriendRequest()
                                            } label: {
                                                Label("Dismiss Request", systemImage: "xmark.circle")
                                            }
                                        } label: {
                                            tagModelView(textLabel: "Respond to Friend Request", systemImage: "arrowtriangle.down.circle.fill", textSize: 14, foregroundColor: .white, backgroundColor: .blue)
                                                .buttonStyle(PlainButtonStyle())
                                        }
                                    } else if person.friendState == "approved" {
                                        tagModelView(textLabel: "Friends", systemImage: "checkmark.circle.fill", textSize: 14, foregroundColor: colorScheme == .dark ? .white : .black, backgroundColor: .gray, opacity: 0.30)
                                    } else if person.friendState == "sent" {
                                        tagModelView(textLabel: "Pending", systemImage: "", textSize: 14, foregroundColor: .black, backgroundColor: .gray, opacity: 0.30)
                                    } else if person.friendState == "private" {
                                        tagModelView(textLabel: "Private", systemImage: "lock.icloud.fill", textSize: 14, foregroundColor: colorScheme == .dark ? .white : .black, backgroundColor: .gray, opacity: 0.30)
                                    } else if person.isPublic && person.username != userHolder.person.username && person.friendState == "" {
                                        Button {
                                            addFriend()
                                        } label: {
                                            tagModelView(textLabel: "Add Friend", textSize: 14, foregroundColor: .white, backgroundColor: .blue)
                                        }
                                    }
                                }
                                .padding(.top, 3)
                            } else if person.username != userHolder.person.username {
                                tagModelView(textLabel: "T", textSize: 14, foregroundColor: .clear, backgroundColor: .clear)
                                    .padding(.top, 3)
                                // blanket clear background to make sure the height gets set while loading friend status.
                            }
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
                            PostsFeed(viewModel: viewModel, person: $person, profileOrFeed: "profile") //person is binding so it updates when parent view updates.
                        }
                        .padding(.top, 10)
                    }
                }
                .task {
                    do {
                        userHolder.profileViewIsLoading = true // sets variable so no 'tag' shows until task has run.
                        defer { userHolder.profileViewIsLoading = false }

                        person = try await userService.retrieveUserInfoFromUserID(person: person, userHolder: userHolder) // repetitive. Need to refactor later.
                    } catch {
                        ViewLogger.error("ProfileView \(error)")
                    }
                    
                }
                .refreshable {
                    Task {
                        if viewModel.isFinished {
                            await viewModel.getPrayerRequests(user: userHolder.person, person: person)
                        }
                    }
                }
                .navigationTitle(person.firstName.capitalized + " " + person.lastName.capitalized)
                .navigationBarTitleDisplayMode(.large)
                .sheet(isPresented: $showSubmit, onDismiss: {
                    Task {
                        do {
                            if viewModel.prayerRequests.isEmpty || userHolder.refresh == true {
                                //                            self.person = try await userService.retrieveUserInfoFromUsername(person: person, userHolder: userHolder)
                                
                                
                                // retrieve the userID from the username submitted only if username is not your own. Will return user's userID if there is a valid username. If not, will return user's own.
                                await viewModel.getPrayerRequests(user: userHolder.person, person: person)
                            } else {
                                self.viewModel.prayerRequests = viewModel.prayerRequests
                            }
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
                .alert(isPresented: $addFriendConfirmation) {
                    return Alert(
                        title: Text("Request Sent"),
                        message: Text("Your friend will appear in your list once the request has been approved."),
                        dismissButton: .default(Text("OK")) {
                            addFriendConfirmation = false
                        })
                }
            }
        }
    }
    
    func addFriend() {
        Task {
            do {
                try await friendService.addFriend(user: userHolder.person, friend: person)
                addFriendConfirmation = true
                person.friendState = "sent"
            } catch {
                ViewLogger.error("ProfileView.addFriend \(error)")
            }
        }
    }
    
    func acceptFriendRequest() {
        Task {
            friendHelper.acceptFriendRequest(friendState: person.friendState, user: userHolder.person, friend: person)
            person.friendState = "approved"
            await viewModel.getPrayerRequests(user: userHolder.person, person: person)
        }
    }
    
    func dismissFriendRequest() {
        Task {
            friendHelper.denyFriendRequest(friendState: person.friendState, user: userHolder.person, friend: person)
            person.friendState = ""
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
