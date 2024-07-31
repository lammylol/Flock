//
//  FriendHelper.swift
//  Flock
//
//  Created by Matt Lam on 7/30/24.
//

import Foundation
import FirebaseFirestore

class FriendHelper {
    var friendService = FriendService()
    
    func acceptOrDenyFriendRequest(acceptOrDeny: Bool, user: Person, friend: Person) async throws {
        if acceptOrDeny {
            try await friendService.addFriend(user: user, friend: friend)
        } else {
            try await friendService.deleteFriend(user: user, friend: friend)
        }
    }
}
