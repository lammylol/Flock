//
//  PostService.swift
//  Flock
//
//  Created by Preston Mar on 7/21/24.
//

import Foundation
import FirebaseFirestore
import FirebaseAuth

class PostService {
    let db = Firestore.firestore() // initiaties Firestore
    
    func getPostList(userID: String) async throws -> (Date, String) { // This function retrieves calendar prayer list data from Firestore.
        var prayStartDate = Date()
        var prayerList: String = ""
        
        guard userID != "" else {
            throw PrayerPersonRetrievalError.noUserID
        }
            
        let ref = db.collection("users").document(userID)
    
        do {
            let document = try await ref.getDocument()
            if document.exists { // Update userHolder with prayer list details from Firestore
                let startDateTimeStamp = document.get("prayStartDate") as? Timestamp ?? Timestamp(date: Date())
                prayStartDate = startDateTimeStamp.dateValue()
                prayerList = document.get("prayerList") as? String ?? ""
            } else {
                print("Document does not exist")
                prayerList = ""
            }
        } catch {
            print(error.localizedDescription)
        }
        
        return (prayStartDate, prayerList)
    }
    
    func retrievePostPersonArray(prayerList: String) async -> [Person] { // This function accepts a prayer list string (from firestore) and returns an array of PrayerPerson's so that the view can grab both the username or name. A prayer list may look like the following: "Matt Lam;lammylol\nEsther Choi;heej\nJoe". Some may have usernames, some may not.
        
        let prayerListArray = prayerList.components(separatedBy: "\n") // Create an array separated by \n within the prayer list string.
        print(prayerListArray.description)
        
        var prayerArray: [Person] = [] // Empty array of Person type.
        var firstName = ""
        var lastName = ""
        var username = ""
        
        if !prayerListArray.isEmpty {
            for person in prayerListArray {
                print(person.description)
                
                let array = person.split(separator: ";", omittingEmptySubsequences: true) // For each person in the array, separate out the array that contains either: [name] or [name, username].
                
                if array.count == 1 { // If the array is [name], then there is no username.
                    username = ""
                } else { // If the array has [name, username], then username is equal to the last of the array.
                    username = String(array.last ?? "").trimmingCharacters(in: .whitespaces).lowercased()
                }
                
                let nameArray = array.first?.split(separator: " ", omittingEmptySubsequences: true) // Split first name from last name from the name portion of the person. If there is middle name, last name will only grab last of array.
                
                if nameArray?.count == 1 { // nameArray?.count == 1 ensures that if user enters only first name, last name will be "", not first name.
                    firstName = String(nameArray?.first ?? "").trimmingCharacters(in: .whitespaces)
                    lastName = ""
                } else {
                    firstName = String(nameArray?.first ?? "").trimmingCharacters(in: .whitespaces)
                    lastName = String(nameArray?.last ?? "").trimmingCharacters(in: .whitespaces)
                }
                
                let prayerPerson = Person(username: username, firstName: firstName, lastName: lastName) // set userID as default user. Upon load, it will check if username exists. If username exists, then will load userID first.
                
                prayerArray.append(prayerPerson)
            } // For each person in the array, separate out the array that contains either: [name] or [name, username]. Create a person object from that data and append to prayer list array.
        }
        
        return prayerArray
    }
    
    func updatePostListData(userID: String, prayStartDate: Date, prayerList: String) {
        // This function enables the user to update user documentation with userID, prayer start date, and prayer list.
        let ref = db.collection("users").document(userID)
        ref.updateData([
            "userID": userID,
            "prayStartDate": prayStartDate,
            "prayerList": prayerList
        ])
    }
}
