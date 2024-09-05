//
//  FriendHelper.swift
//  Flock
//
//  Created by Matt Lam on 8/29/24.
//

import Foundation

class FriendHelper {
    var friendService = FriendService()
    
    func acceptFriendRequest(friendState: String, user: Person, friend: Person) {
        Task {
            guard friendState == "pending" else {
                return
            }
            
            do {
                try await friendService.acceptOrDenyFriendRequest(acceptOrDeny: true, user: user, friend: friend)
            } catch {
                print(error)
            }
        }
    }
    
    func denyFriendRequest(friendState: String, user: Person, friend: Person) {
        Task {
            guard friendState == "pending" else {
                print("No action pending")
                return
            }
            
            do {
                try await friendService.acceptOrDenyFriendRequest(acceptOrDeny: false, user: user, friend: friend)
            } catch {
                print(error)
            }
        }
    }
}
