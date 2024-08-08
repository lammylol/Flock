//
//  ContactView.swift
//  Flock
//
//  Created by Matt Lam on 7/30/24.
//

import SwiftUI

struct ContactRow: View {
    @Environment(UserProfileHolder.self) var userHolder
    
    var person: Person
    var friendService = FriendService()
    var calendarService = CalendarService()
    @State var removeFriendConfirm: Bool = false
//    var friendState: String
    
    var body: some View {
        NavigationLink(destination: ProfileView(person: person)) {
            HStack(alignment: .center) {
                ProfilePictureAvatar(firstName: person.firstName, lastName: person.lastName, imageSize: 55, fontSize: 20)
                    .padding(.horizontal, 7)
                
                VStack(alignment: .leading) {
                    HStack {
                        Text("\(person.firstName) \(person.lastName)")
                            .font(.system(size: 20))
                            .bold()
                        if person.isPublic && person.friendState != "pending" {
                            Image(systemName: "checkmark.circle.fill")
                        }
                        Spacer()
                        Menu {
                            Button {
                                removeFriendConfirm = true
                            } label: {
                                Label("Remove Friend", systemImage: "minus.square")
                            }
                        } label: {
                            Label("", systemImage: "ellipsis")
                        }
                        .highPriorityGesture(TapGesture())
                        .confirmationDialog("Are you sure?", isPresented: $removeFriendConfirm) {
                            Button("Delete Friend", role: .destructive) {
                                self.removeFriend(friend: person)
                            }
                        } message: {
                            Text("Your friend's history will be deleted from your feed and you will no longer appear on their feed.")
                        }
                    }
                    .padding(.bottom, -3)
                    
                    HStack {
                        if person.friendState == "pending" {
                            Button(action: {
                                acceptFriendRequest(friendState: person.friendState)
                            }) {
                                Text("Accept")
                                    .padding([.vertical], 5)
                                    .padding([.horizontal], 20)
                                    .font(.system(size: 16))
                            }
                            .buttonStyle(PlainButtonStyle())
                            .background {
                                RoundedRectangle(cornerRadius: 5)
                                    .fill(.blue)
                            }
                            .foregroundStyle(.white)
                            
                            Button(action: {
                                denyFriendRequest(friendState: person.friendState)
                            }) {
                                Text("Dismiss")
                                    .padding([.vertical], 5)
                                    .padding([.horizontal], 20)
                                    .font(.system(size: 16))
                            }
                            .background {
                                RoundedRectangle(cornerRadius: 5)
                                    .fill(.gray)
                                    .opacity(0.30)
                            }
                            .foregroundStyle(.black)
                            .buttonStyle(PlainButtonStyle())
                        } else {
                            Text(person.isPublic ? "Public Account" : "Private")
                                .padding([.vertical], 3)
                                .padding([.horizontal], 20)
                                .font(.system(size: 16))
                                .background {
                                    RoundedRectangle(cornerRadius: 5)
                                        .fill(.gray)
                                        .opacity(0.30)
                                }
                        }
                        Spacer()
                    }
                }
                .padding(.vertical, 10)
            }
            .frame(height: 80)
            .frame(maxWidth: .infinity)
            .background{
                Rectangle().fill(.windowBackground)
            }
        }
        .buttonStyle(PlainButtonStyle())
    }
        
    func acceptFriendRequest(friendState: String) {
        Task {
            guard friendState == "pending" else {
                print("No action pending")
                return
            }
            
            do {
                try await friendService.acceptOrDenyFriendRequest(acceptOrDeny: true, user: userHolder.person, friend: person)
//                let friends = try await friendService.getFriendsList(userID: userHolder.person.userID) // run to refresh friends list on command
//                self.userHolder.friendsList = friends.0
//                self.userHolder.pendingFriendsList = friends.1
                print("userHolder.friendsList: \(userHolder.friendsList)")
            } catch {
                print(error)
            }
        }
    }
    
    func denyFriendRequest(friendState: String) {
        Task {
            guard friendState == "pending" else {
                print("No action pending")
                return
            }
            
            do {
                try await friendService.acceptOrDenyFriendRequest(acceptOrDeny: false, user: userHolder.person, friend: person)
//                let friends = try await friendService.getFriendsList(userID: userHolder.person.userID) // run to refresh friends list on command
//                self.userHolder.friendsList = friends.0
//                self.userHolder.pendingFriendsList = friends.1
                print("test")
            } catch {
                print(error)
            }
        }
    }
    
    func removeFriend(friend: Person) {
        Task {
            do {
                try await friendService.deleteFriend(user: userHolder.person, friend: person)
                try await friendService.deleteFriend(user: person, friend: userHolder.person)
            } catch {
                print(error)
            }
        }
    }
    
    func addToCalendar(friend: Person) {
        Task {
            if friend.isPublic {
                userHolder.prayerList.append("\n\(friend.firstName) \(friend.lastName); \(friend.username)")
            } else {
                userHolder.prayerList.append("\n\(friend.firstName) \(friend.lastName)")
            }
            
            do {
                //Update Prayer Calendar in Firestore
                try await calendarService.updatePrayerCalendarList(userID: userHolder.person.userID, prayStartDate: userHolder.prayStartDate, prayerList: userHolder.prayerList)
                
                //Update Prayer Calendar array saved locally
                userHolder.prayerListArray = await calendarService.retrieveCalendarPersonArray(prayerList: userHolder.prayerList)
                
                //Update friend indicator that they are added to your calendar.
//                try await friendService.addFriendtoCalendarIndicator(user: userHolder.person, friend: friend)
                print("test")
            } catch {
                print(error)
            }
        }
    }

}

#Preview {
    ContactRow(person: Person(username: "lammylol", email: "matthewthelam@gmail.com", firstName: "Matt", lastName: "Lam", friendState: "pending"))
        .environment(UserProfileHolder())
}
