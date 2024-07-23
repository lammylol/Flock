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
    
    func getUserInfo(userID: String) async throws -> Person {
        // get user information and save it to userHolder.person
        var person = Person()
        
        do {
            let ref = db.collection("users").document(userID)
            let document = try await ref.getDocument()
            let dataDescription = document.data().map(String.init(describing:)) ?? "nil"
            
            let firstName = document.get("firstName") as? String ?? ""
            let lastName = document.get("lastName") as? String ?? ""
            let username = document.get("username") as? String ?? ""
            let userID = document.get("userID") as? String ?? ""
            let email = document.get("email") as? String ?? ""
            
            person = Person(userID: userID, username: username, email: email, firstName: firstName, lastName: lastName)
        } catch {
            print("Error retrieving user info. \(error)")
        }
        
        return person
    }
    
    func retrieveUserInfoFromUsername(person: Person, userHolder: UserProfileHolder) async throws -> Person {
        // This function takes in a person object and returns additional information about the person. ie. if a user is accessing a profile for a username, this will retrieve information needed to fetch their data.
        var userID = person.userID
        var firstName = person.firstName
        var lastName = person.lastName
        
        if person.userID == "" { // Only perform if the person's userID is empty. If not, assume the data for the user already exists.
            if person.username == "" { // If the username is empty, this person was 'created' by the user, so retrieve user's userID.
                userID = userHolder.person.userID
            } else { // If username exists, then request user document from firestore off of the username.
                do {
                    let ref = try await db.collection("users").whereField("username", isEqualTo: person.username).getDocuments()
                    
                    for document in ref.documents {
                        if document.exists {
//                            let dataDescription = document.data()
                            userID = document.get("userID") as? String ?? ""
                            firstName = document.get("firstName") as? String ?? ""
                            lastName = document.get("lastName") as? String ?? ""
                        } else {
                            throw PrayerPersonRetrievalError.noUsername
                        }
                    }
                } catch {
                    print("Error getting document: \(error)")
                }
            }
        }
        return Person(userID: userID, username: person.username, firstName: firstName, lastName: lastName)
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
            print("Error retrieving username reference")
            check = false
        }
        return check
    }
}
