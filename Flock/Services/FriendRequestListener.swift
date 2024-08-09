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
    
    func setUpListener(userID: String) async {
        let db = Firestore.firestore()
        
        friendRequestListener = db.collection("users").document(userID).collection("friendsList")/*.whereField("state", isEqualTo: "pending")*/
            .addSnapshotListener { querySnapshot, error in
                guard let documents = querySnapshot?.documents else {
                    print("Error fetching friendRequests: \(error!)")
                    return
                }
                
//                // Check if the snapshot has changes or if it comes from the server
//                guard !(querySnapshot?.metadata.hasPendingWrites)! && querySnapshot?.metadata.isFromCache == false else {
//                    return
//                }
                
                var newPendingFriendRequests: [Person] = []
                var newAcceptedFriendRequests: [Person] = []
                
                for document in documents {
                    if document.exists {
                        let userID = document.get("userID") as? String ?? ""
                        let username = document.get("username") as? String ?? ""
                        let email = document.get("email") as? String ?? ""
                        let firstName = document.get("firstName") as? String ?? ""
                        let lastName = document.get("lastName") as? String ?? ""
                        let state = document.get("state") as? String ?? ""
                        
                        let person = Person(userID: userID, username: username, email: email, firstName: firstName, lastName: lastName, friendState: state)
                        
                        if state == "pending" {
                            newPendingFriendRequests.append(person)
                        } else {
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
        print("FriendsListener turned on.")
    }
    
    func removeListener() {
        friendRequestListener?.remove()
        print("FriendsListener turned off.")
    }
}
