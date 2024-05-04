//
//  PrayerRequestsView.swift
//  Prayer Calendar
//
//  Created by Matt Lam on 11/10/23.
//

// This is the view to capture the list of prayer requests.

import SwiftUI
import FirebaseFirestore

struct ProfilePrayerRequestsView: View {
    @Environment(UserProfileHolder.self) var userHolder
    @State var viewModel: PrayerRequestViewModel
    
    @State var person: Person
    @State private var showSubmit: Bool = false
    @State private var showEdit: Bool = false
    @State private var height: CGFloat = 0
    
    let db = Firestore.firestore()
    
    var body: some View {
        LazyVStack {
            HStack{
//                if viewModel.selectedStatus == .noLongerNeeded {
//                    Text("No Longer Needed Prayer Requests")
//                        .font(.title3)
//                        .bold()
//                        .frame(maxWidth: .infinity, alignment: .leading)
//                        .padding(.leading, 2)
//                } else {
//                    Text("\(viewModel.selectedStatus.rawValue.capitalized) Prayer Requests")
//                        .font(.title3)
//                        .bold()
//                        .frame(maxWidth: .infinity, alignment: .leading)
//                        .padding(.leading, 2)
//                }      
                // Only show this if you are the owner of profile.
                if person.username == userHolder.person.username {
                    Text("My Prayer Requests")
                        .font(.title3)
                        .bold()
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .padding(.leading, 20)
                } else {
                    Text("\(person.firstName)'s Prayer Requests")
                        .font(.title3)
                        .bold()
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .padding(.leading, 20)
                }
                Spacer()
                
                HStack {
                    if viewModel.selectedStatus == .noLongerNeeded {
                        Text("No Longer\nNeeded")
                            .font(.system(size: 11))
                            .multilineTextAlignment(.trailing)
                    } else {
                        Text(viewModel.selectedStatus.rawValue.capitalized)
                            .font(.system(size: 14))
                            .multilineTextAlignment(.trailing)
                    }
                    
                    StatusPicker(viewModel: viewModel)
                }
                .padding(.trailing, 20)
//                    .padding(.leading, 20)
                
//                // Only show this if the account has been created under your userID. Aka, can be your profile or another that you have created for someone.
//                if person.userID == userHolder.person.userID {
//                    Button(action: { showSubmit.toggle()
//                    }) {
//                        Image(systemName: "plus.circle.fill")
//                            .resizable()
//                            .frame(width: 25.0, height: 25.0)
//                    }
//                    .padding(.trailing, 15)
//                }
            }
            Divider()
            
            FeedRequestsRowView(viewModel: viewModel, height: $height, person: person, profileOrFeed: "profile")
        }
        .overlay {
            // Only show this if this account is saved under your userID.
            if person.username == "" || person.userID == userHolder.person.userID {
                if viewModel.prayerRequests.isEmpty && viewModel.selectedStatus == .current && viewModel.isFinished {
                    VStack{
                        ContentUnavailableView {
                            Label("No Prayer Requests", systemImage: "list.bullet.rectangle.portrait")
                        } description: {
                            Text("Start adding prayer requests to your list")
                        } actions: {
                            Button(action: {showSubmit.toggle() })
                            {
                                Text("Add Prayer Request")
                            }
                        }
                        .frame(height: 250)
                        .offset(y: 120)
                        Spacer()
                    }
                }
            }
        }
        .task {
            do {
                print(viewModel.selectedStatus.rawValue)
//                viewModel.selectedStatus = .current
//                        await viewModel.getPrayerRequests(user: userHolder.person, person: person, profileOrFeed: "profile")
                print("Success retrieving prayer requests for \(person.userID)")
            } catch {
                print(error.localizedDescription)
            }
        }
        .sheet(isPresented: $showSubmit, onDismiss: {
            Task {
                do {
                    if viewModel.prayerRequests.isEmpty || userHolder.refresh == true {
                        self.person = try await PrayerPersonHelper().retrieveUserInfoFromUsername(person: person, userHolder: userHolder) // retrieve the userID from the username submitted only if username is not your own. Will return user's userID if there is a valid username. If not, will return user's own.
                        await viewModel.getPrayerRequests(user: userHolder.person, person: person, profileOrFeed: "profile")
                    } else {
                        self.viewModel.prayerRequests = viewModel.prayerRequests
                        self.height = height
                    }
                    print("Success retrieving prayer requests for \(person.userID)")
                }
            }
        }, content: {
            SubmitPrayerRequestForm(person: person)
        })
        
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }
}

struct StatusPicker: View {
    @State var viewModel: PrayerRequestViewModel
    @Environment(UserProfileHolder.self) var userHolder
    @Environment(\.colorScheme) var colorScheme
    
    var body: some View {
        Menu {
            Button {
                viewModel.selectedStatus = .current
                userHolder.refresh = true
            } label: {
                Text("Current")
            }
            Button {
                viewModel.selectedStatus = .answered
                userHolder.refresh = true
            } label: {
                Text("Answered")
            }
            Button {
                viewModel.selectedStatus = .noLongerNeeded
                userHolder.refresh = true
            } label: {
                Text("No Longer Needed")
            }
        } label: {
            Image(systemName: "line.3.horizontal.decrease.circle.fill")
                .resizable()
                .frame(width: 20.0, height: 20.0)
                .foregroundStyle(colorScheme == .dark ? .white : .black)
//            if viewModel.selectedStatus == .noLongerNeeded {
//                Text("No Longer Needed")
//                    .padding(.horizontal, 10)
//                    .foregroundStyle(.white)
//                    .background {
//                        RoundedRectangle(cornerRadius: 10)
//                            .fill(.blue)
//                    }
//            } else {
//                Text(viewModel.selectedStatus.rawValue.capitalized)
//                    .padding(.horizontal, 10)
//                    .foregroundStyle(.white)
//                    .background {
//                        RoundedRectangle(cornerRadius: 10)
//                            .fill(.blue)
//                    }
//            }
        }
    }
}

//#Preview {
//    ProfilePrayerRequestsView(person: Person(userID: "aMq0YdteGEbYXWlSgxehVy7Fyrl2", username: "lammylol"))
//}
//
//#Preview {
//    StatusPicker(viewModel: PrayerRequestViewModel())
//}
