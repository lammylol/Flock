//
//  FriendRequestListener.swift
//  Flock
//
//  Created by Matt Lam on 7/31/24.
//

import Foundation
import FirebaseFirestore

@Observable class FriendRequestListener {
    private var friendRequestListener: ListenerRegistration?
    var pendingFriendRequests: [Person] = []
    var acceptedFriendRequests: [Person] = []
    
    func setUpListener(userID: String) async throws {
        let db = Firestore.firestore()
        
        guard userID != "" else {
            throw PrayerRequestRetrievalError.noUserID
        }
        
        friendRequestListener = db.collection("users").document(userID).collection("friendsList")
            .addSnapshotListener { querySnapshot, error in
                guard let documents = querySnapshot?.documents else {
                    NetworkingLogger.error("FriendRequestListener.setUpListener Error fetching friendRequests: \(error!)")
                    return
                }
                
                var newPendingFriendRequests: [Person] = []
                var newAcceptedFriendRequests: [Person] = []
                
                for document in documents {
                    if document.exists {
                        let userID = document.get("userID") as? String ?? ""
                        let username = document.get("username") as? String ?? ""
                        let email = document.get("email") as? String ?? ""
                        let firstName = document.get("firstName") as? String ?? ""
                        let lastName = document.get("lastName") as? String ?? ""
                        let state = Person.FriendState(rawValue: document.get("state") as? String ?? "") ?? .none
                        
                        let person = Person(userID: userID, username: username, email: email, firstName: firstName, lastName: lastName, friendState: state)
                        
                        if state == .pending {
                            newPendingFriendRequests.append(person)
                        } else if state == .approved {
                            newAcceptedFriendRequests.append(person)
                        }
                    }
                }
                
                if newPendingFriendRequests != self.pendingFriendRequests {
                    self.pendingFriendRequests = newPendingFriendRequests
                }
                
                if newAcceptedFriendRequests != self.acceptedFriendRequests {
                    self.acceptedFriendRequests = newAcceptedFriendRequests
                }
            }
        NetworkingLogger.info("FriendRequestListener turned on.")
    }
    
    func removeListener() {
        friendRequestListener?.remove()
        NetworkingLogger.info("FriendRequestListener turned off.")
    }
    
    @MainActor // ensure runs on main thread.
    func resetListener() {
        self.pendingFriendRequests = []
        self.acceptedFriendRequests = []
        NetworkingLogger.info("FriendRequestListener arrays have been reset.")
    }
}
