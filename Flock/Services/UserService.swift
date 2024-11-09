//
//  UserService.swift
//  Flock
//
//  Created by Preston Mar on 7/21/24.
//

import Foundation
import FirebaseFirestore
import FirebaseAuth

class UserService { // Functions related to user information
    let db = Firestore.firestore() // initiaties Firestore
    
    func getBasicUserInfo(userID: String) async throws -> Person {
        // get user information and save it to userHolder.person
        var person = Person()
        
        do {
            let ref = db.collection("users").document(userID)
            let document = try await ref.getDocument()
            
            let firstName = document.get("firstName") as? String ?? ""
            let lastName = document.get("lastName") as? String ?? ""
            let username = document.get("username") as? String ?? ""
            let userID = document.get("userID") as? String ?? ""
            let email = document.get("email") as? String ?? ""
            
            person = Person(userID: userID, username: username, email: email, firstName: firstName, lastName: lastName)
            NetworkingLogger.debug("userService.getBasicUserInfo \(userID, privacy: .private)")
        } catch {
            NetworkingLogger.error("userService.getBasicUserInfo failed \(userID) \(error)")
        }
        
        return person
    }
    
    @MainActor
    func retrieveUserInfoFromUserID(person: Person, userHolder: UserProfileHolder) async throws -> Person {
        // This function takes in a person object and returns additional information about the person. ie. if a user is accessing a profile for a username, this will retrieve information needed to fetch their data.
        var userID = person.userID
        var firstName = person.firstName
        var lastName = person.lastName
        var friendState = person.friendState
        var username = person.username
        
        // Ensure user is still authenticated before running the task
         guard Auth.auth().currentUser != nil else {
             ViewLogger.info("User is not authenticated. Aborting fetch of user info.")
             return Person()
         }
        
        if person.isPrivateFriend || person.username == "" { // If the username is empty, this person was 'created' by the user, so retrieve user's userID.
            userID = userHolder.person.userID
            friendState = "private"
        } else { // If username exists, then request user document from firestore off of the username.
            do {
                let document = try await db.collection("users").document(userHolder.person.userID).collection("friendsList").document(person.userID).getDocument()
                
//                for document in ref.documents {
                if document.exists {
                    userID = document.get("userID") as? String ?? ""
                    firstName = document.get("firstName") as? String ?? ""
                    lastName = document.get("lastName") as? String ?? ""
                    username = document.get("username") as? String ?? ""
                    friendState = document.get("state") as? String ?? ""
                }
            } catch {
                NetworkingLogger.error("userService.retrieveUserInfoFromUserID failed \(error)")
            }
        }
        NetworkingLogger.debug("userService.retrieveUserInfoFromUserID got \(person.userID, privacy: .private)")
        return Person(userID: userID, username: username, firstName: firstName, lastName: lastName, friendState: friendState)
    }
    
    func checkIfUsernameExists(username: String) async -> Bool {
        // This function allows you to pass in a username and return a boolean whether the username exists already. For account creation.
        var check = Bool()
        
        do {
            let ref = db.collection("usernames").document(username)
            if try await ref.getDocument().exists {
                check = true
            } else {
                check = false
            }
        } catch {
            NetworkingLogger.error("Error retrieving username reference")
            check = false
        }
        return check
    }
    
    
    func resetInfoOnSignout(listener: FriendRequestListener, userHolder: UserProfileHolder) async {
        await listener.resetListener()
        await userHolder.resetUserProfileHolder()
    }
}
