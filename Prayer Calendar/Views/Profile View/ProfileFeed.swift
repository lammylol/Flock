//
//  PrayerRequestsView.swift
//  Prayer Calendar
//
//  Created by Matt Lam on 11/10/23.
//

// This is the view to capture the list of prayer requests.

import SwiftUI
import FirebaseFirestore

struct ProfileFeed: View {
    @Environment(UserProfileHolder.self) var userHolder
    @State var viewModel: FeedViewModel
    
    @State var person: Person
    @State private var showSubmit: Bool = false
    @State private var showEdit: Bool = false
    @State private var height: CGFloat = 0
    
    let db = Firestore.firestore()
    
    var body: some View {
        LazyVStack {
            HStack{    
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
                        await viewModel.getPrayerRequests(user: userHolder.person, person: person)
                    } else {
                        self.viewModel.prayerRequests = viewModel.prayerRequests
                        self.height = height
                    }
                    print("Success retrieving prayer requests for \(person.userID)")
                }
            }
        }, content: {
            SubmitPostForm(person: person)
        })
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }
}

//#Preview {
//    ProfilePrayerRequestsView(person: Person(userID: "aMq0YdteGEbYXWlSgxehVy7Fyrl2", username: "lammylol"))
//}
//
//#Preview {
//    StatusPicker(viewModel: PrayerRequestViewModel())
//}
