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
    @State private var showSubmit: Bool = false
    @State private var showEditView: Bool = false
    @State var person: Person
    @State var viewModel: PrayerRequestViewModel = PrayerRequestViewModel()
    
    @Environment(UserProfileHolder.self) var userHolder
    @Environment(UserProfileHolder.self) var dataHolder
    
    var body: some View {
        NavigationStack {
            ScrollView {
                VStack {
                    Text("")
                        .toolbar {
                            // Only show this if the account has been created under your userID. Aka, can be your profile or another that you have created for someone.
                            if person.username == "" || person.userID == userHolder.person.userID {
                                ToolbarItemGroup(placement: .topBarTrailing) {
                                        NavigationLink(destination: ProfileSettingsView()) {
                                            Image(systemName: "gear")
                                                .resizable()
                                        }
                                        .padding(.trailing, -10)
                                        .padding(.top, 2)
                                        
                                        Button(action: {
                                            showSubmit.toggle()
                                        }) {
                                            Image(systemName: "square.and.pencil")
                                        }
                                    }
                            }
                        }
                    
                    HStack {
                        Text(usernameDisplay())
                        Spacer()
                    }
                    .padding([.leading, .trailing], 20)
                    .font(.system(size: 14))
                    
                    Spacer()
                    
                    if userHolder.person.username == person.username {
                        ProfilePrayerRequestsView(viewModel: viewModel, person: userHolder.person) // Leaving as a separate view for now in case need to implement tab view.
                            .frame(maxHeight: .infinity)
                            .padding(.top, 20)
                    } else {
                        ProfilePrayerRequestsView(viewModel: viewModel, person: person) // Leaving as a separate view for now in case need to implement tab view.
                            .frame(maxHeight: .infinity)
                            .padding(.top, 20)
                    }
                }
            }
            .navigationTitle(person.firstName + " " + person.lastName)
            .navigationBarTitleDisplayMode(.automatic)
            .refreshable {
                Task {
                    do {
                        userHolder.refresh = true
                    }
                }
            }
//            .task {
//                if person.userID == "" {
//                    do {
//                        person = try await PrayerPersonHelper().retrieveUserInfoFromUsername(person: person, userHolder: userHolder)
//                    } catch {
//                        print(error.localizedDescription)
//                    }
//                }
//            }
            .sheet(isPresented: $showSubmit, onDismiss: {
                Task {
                    do {
                        if viewModel.prayerRequests.isEmpty || userHolder.refresh == true {
                            self.person = try await PrayerPersonHelper().retrieveUserInfoFromUsername(person: person, userHolder: userHolder) // retrieve the userID from the username submitted only if username is not your own. Will return user's userID if there is a valid username. If not, will return user's own.
                            await viewModel.getPrayerRequests(user: userHolder.person, person: person, profileOrFeed: "profile")
                        } else {
                            self.viewModel.prayerRequests = viewModel.prayerRequests
//                            self.height = height
                        }
                        print("Success retrieving prayer requests for \(person.userID)")
                    }
                }
            }, content: {
                SubmitPrayerRequestForm(person: person)
            })
        }
    }
    
    func usernameDisplay() -> String {
        if person.username == "" {
            return "unlinked"
        } else {
            return "username: \(person.username.capitalized)"
        }
    }
}

#Preview {
    ProfileView(person: Person(userID: "aMq0YdteGEbYXWlSgxehVy7Fyrl2", username: "lammylol"))
        .environment(UserProfileHolder())
        .environment(UserProfileHolder())
}
