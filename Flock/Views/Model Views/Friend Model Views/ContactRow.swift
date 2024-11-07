//
//  ContactView.swift
//  Flock
//
//  Created by Matt Lam on 7/30/24.
//

import SwiftUI

struct ContactRow: View {
    @Environment(NavigationManager.self) var navigationManager
    @Environment(UserProfileHolder.self) var userHolder
    @Environment(\.colorScheme) var colorScheme
    
    var person: Person
    var friendService = FriendService()
    var friendHelper = FriendHelper()
    var calendarService = CalendarService()
    @State var removeFriendConfirm: Bool = false
//    var friendState: String
    
    var body: some View {
        Button {
            navigationManager.navigateTo(NavigationItem.person(person))
        } label: {
            HStack(alignment: .center) {
                ProfilePictureAvatar(firstName: person.firstName, lastName: person.lastName, imageSize: 55, fontSize: 20)
                    .padding(.horizontal, 7)
                
                VStack(alignment: .leading) {
                    HStack {
                        Text("\(person.firstName.capitalized) \(person.lastName.capitalized)")
                            .font(.system(size: 20))
                            .bold()
                        if person.isPublic && person.friendState != "pending" {
                            Image(systemName: "checkmark.circle.fill")
                                .foregroundStyle(.blue)
                        } else if !person.isPublic {
                            Image(systemName: "lock.icloud.fill")
                                .foregroundStyle(colorScheme == .dark ? .white : .black )
                        }
                        Spacer()
                        
                        if person.friendState != "pending" {
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
                    }
                    .padding(.bottom, -3)
                    
                    HStack {
                        if person.friendState == "pending" {
                            Button(action: {
                                friendHelper.acceptFriendRequest(friendState: person.friendState, user: userHolder.person, friend: person)
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
                                friendHelper.denyFriendRequest(friendState: person.friendState, user: userHolder.person, friend: person)
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
                            .foregroundStyle(colorScheme == .dark ? .white : .black)
                            .buttonStyle(PlainButtonStyle())
                        } else {
                            if person.isPublic {
                                tagModelView(textLabel: "Public Account", systemImage: "", textSize: 16, foregroundColor: colorScheme == .dark ? .white : .black, backgroundColor: Color(UIColor.systemGray6), opacity: 1.00, boldBool: false)
                            } else {
                                tagModelView(textLabel: "Private Account", systemImage: "", textSize: 16, foregroundColor: colorScheme == .dark ? .white : .black, backgroundColor: Color(UIColor.systemGray6), opacity: 1.00, boldBool: false)
                            }
                        }
                        Spacer()
                    }
                }
                .padding(.vertical, 10)
            }
        }
        .frame(height: 80)
        .frame(maxWidth: .infinity)
        .background{
            Rectangle().fill(.background)
        }
        .foregroundStyle(.primary)
    }
    
    func removeFriend(friend: Person) {
        Task {
            do {
                try await friendService.deleteFriend(user: userHolder.person, friend: person)
            } catch {
                ViewLogger.error("ContactRow \(error)")
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
            } catch {
                ViewLogger.error("ContactRow \(error)")
            }
        }
    }

}

#Preview {
    ContactRow(person: Person(username: "lammylol", email: "matthewthelam@gmail.com", firstName: "Matt", lastName: "Lam", friendState: "pending"))
        .environment(UserProfileHolder())
}
