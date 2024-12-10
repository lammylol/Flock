//
//  FriendHelper.swift
//  Flock
//
//  Created by Matt Lam on 8/29/24.
//

import Foundation

class FriendHelper {
    var friendService = FriendService()
    
    func acceptFriendRequest(friendState: Person.FriendState, user: Person, friend: Person) {
        Task {
            guard friendState == .pending else {
                return
            }
            
            do {
                try await friendService.acceptOrDenyFriendRequest(acceptOrDeny: true, user: user, friend: friend)
            } catch {
                NetworkingLogger.error("error accepting friend reqeuest \(user.userID, privacy: .private) \(friend.userID, privacy: .private)")
            }
        }
    }
    
    func denyFriendRequest(friendState: Person.FriendState, user: Person, friend: Person) {
        Task {
            guard friendState == .pending else {
                return
            }
            
            do {
                try await friendService.acceptOrDenyFriendRequest(acceptOrDeny: false, user: user, friend: friend)
            } catch {
                NetworkingLogger.error("error declining friend reqeuest \(user.userID, privacy: .private) \(friend.userID, privacy: .private)")
            }
        }
    }
}
