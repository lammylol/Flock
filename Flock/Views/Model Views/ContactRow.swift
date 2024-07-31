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
//    var friendState: String
    
    var body: some View {
        HStack {
            Spacer()
            
            ProfilePictureAvatar(firstName: person.firstName, lastName: person.lastName, imageSize: 60, fontSize: 25)
                .padding(.trailing, 7)
            
            VStack (alignment: .leading) {
                Spacer()
                HStack {
                    Text("\(person.firstName) \(person.lastName)")
                        .font(.system(size: 24))
                        .bold()
                    // Friend State Text below
                }
                .padding(.bottom, -3)
                HStack {
                    if (person.friendState == "pending") {
                        Button(action: { acceptFriendRequest(friendState: person.friendState)
                        }) {
                            Text("Accept")
                                .padding([.vertical], 5)
                                .padding([.horizontal], 20)
                                .font(.system(size: 16))
                        }
                        .background {
                            RoundedRectangle(cornerRadius: 5)
                                .fill(.blue)
                        }
                        .foregroundStyle(.white)
                        
                        Button(action: { denyFriendRequest(friendState: person.friendState)
                        }) {
                            Text("Dismiss")
                                .padding([.vertical], 5)
                                .padding([.horizontal], 20)
                                .font(.system(size: 16))
                        }
                        .background {
                            RoundedRectangle(cornerRadius: 5)
                                .fill(.gray)
                                .opacity(0.40)
                        }
                        .foregroundStyle(.black)
                    }
                }
                Spacer()
            }
            .padding(.vertical, 10)
            Spacer()
        }
        .frame(maxWidth: .infinity)
        .frame(height: 70)
    }
        
    func acceptFriendRequest(friendState: String) {
        Task {
            guard friendState == "pending" else {
                print("No action pending")
                return
            }
            
            do {
                try await FriendHelper().acceptOrDenyFriendRequest(acceptOrDeny: true, user: userHolder.person, friend: person)
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
                try await FriendHelper().acceptOrDenyFriendRequest(acceptOrDeny: false, user: userHolder.person, friend: person)
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
