//
//  PrayerRequestHelper.swift
//  Prayer Calendar
//
//  Created by Matt Lam on 11/19/23.
//

import Foundation
import SwiftUI
import FirebaseFirestore
import FirebaseFunctions

enum PrayerRequestRetrievalError: Error {
    case noUserID
    case noPrayerRequestID
    case noPrayerRequest
    case errorRetrievingFromFirebase
}

class PrayerRequestHelper {
    let db = Firestore.firestore()

    //Retrieve prayer requests from Firestore
    func getPrayerRequests(userID: String, person: Person, status: String?) async throws -> [Post] {
        var prayerRequests = [Post]()
        
        guard userID != "" else {
            throw PrayerRequestRetrievalError.noUserID
        }
        
        var profiles: Query
        
        do {
            if status == "isPinned" {
                profiles = db.collection("users").document(userID).collection("prayerList").document("\(person.firstName.lowercased())_\(person.lastName.lowercased())").collection("prayerRequests").whereField("isPinned", isEqualTo: true).order(by: "latestUpdateDatePosted", descending: true)
            } else if status != nil { // if a status is passed, retrieve prayer list with status filtered.
                profiles = db.collection("users").document(userID).collection("prayerList").document("\(person.firstName.lowercased())_\(person.lastName.lowercased())").collection("prayerRequests").whereField("status", isEqualTo: status!).order(by: "latestUpdateDatePosted", descending: true)
            } else { // if a status is not passed, retrieve all prayers.
                profiles = db.collection("users").document(userID).collection("prayerList").document("\(person.firstName.lowercased())_\(person.lastName.lowercased())").collection("prayerRequests").order(by: "latestUpdateDatePosted", descending: true)
            }
            
            let querySnapshot = try await profiles.getDocuments()
            
            for document in querySnapshot.documents {
//                print("\(document.documentID) => \(document.data())")
                let timestamp = document.data()["datePosted"] as? Timestamp ?? Timestamp()
                let datePosted = timestamp.dateValue()
                
                let latestTimestamp = document.data()["latestUpdateDatePosted"] as? Timestamp ?? Timestamp()
                let latestUpdateDatePosted = latestTimestamp.dateValue()
                
                let firstName = document.data()["firstName"] as? String ?? ""
                let lastName = document.data()["lastName"] as? String ?? ""
                let postTitle = document.data()["prayerRequestTitle"] as? String ?? ""
                let postText = document.data()["prayerRequestText"] as? String ?? ""
                let postType = document.data()["postType"] as? String ?? ""
                let status = document.data()["status"] as? String ?? ""
                let userID = document.data()["userID"] as? String ?? ""
                let username = document.data()["username"] as? String ?? ""
                let privacy = document.data()["privacy"] as? String ?? "private"
                let isPinned = document.data()["isPinned"] as? Bool ?? false
                let documentID = document.documentID as String
                let latestUpdateText = document.data()["latestUpdateText"] as? String ?? ""
                let latestUpdateType = document.data()["latestUpdateType"] as? String ?? ""
                
                let prayerRequest = Post(id: documentID, 
                                         date: datePosted,
                                         userID: userID,
                                         username: username,
                                         firstName: firstName,
                                         lastName: lastName,
                                         postTitle: postTitle,
                                         postText: postText,
                                         postType: postType,
                                         status: status,
                                         latestUpdateText: latestUpdateText,
                                         latestUpdateDatePosted: latestUpdateDatePosted,
                                         latestUpdateType: latestUpdateType,
                                         privacy: privacy,
                                         isPinned: isPinned)
                
                prayerRequests.append(prayerRequest)
            }
        } catch {
            print("Error getting documents: \(error)")
        }
        return prayerRequests
    }
    
    func getPrayerRequest(prayerRequest: Post) async throws -> Post {
        guard prayerRequest.id != "" else {
            throw PrayerRequestRetrievalError.noPrayerRequestID
        }
        
        let ref = db.collection("prayerRequests").document(prayerRequest.id)
        let isPinned = prayerRequest.isPinned // Need to save separately because isPinned is not stored in larger 'prayer requests' collection. Only within a user's feed.
        var prayerRequest = Post.blank
        
        do {
            let document = try await ref.getDocument()
            
            guard document.exists else {
                throw PrayerRequestRetrievalError.noPrayerRequest
            }

            if document.exists {
                let timestamp = document.data()?["datePosted"] as? Timestamp ?? Timestamp()
                let datePosted = timestamp.dateValue()
                
                let latestTimestamp = document.data()?["latestUpdateDatePosted"] as? Timestamp ?? Timestamp()
                let latestUpdateDatePosted = latestTimestamp.dateValue()
                
                let firstName = document.data()?["firstName"] as? String ?? ""
                let lastName = document.data()?["lastName"] as? String ?? ""
                let postTitle = document.data()?["prayerRequestTitle"] as? String ?? ""
                let postText = document.data()?["prayerRequestText"] as? String ?? ""
                let postType = document.data()?["postType"] as? String ?? ""
                let status = document.data()?["status"] as? String ?? ""
                let userID = document.data()?["userID"] as? String ?? ""
                let username = document.data()?["username"] as? String ?? ""
                let privacy = document.data()?["privacy"] as? String ?? "private"
                let documentID = document.documentID as String
                let latestUpdateText = document.data()?["latestUpdateText"] as? String ?? ""
                let latestUpdateType = document.data()?["latestUpdateType"] as? String ?? ""
            
                prayerRequest = Post(id: documentID, 
                                     date: datePosted,
                                     userID: userID,
                                     username: username,
                                     firstName: firstName,
                                     lastName: lastName,
                                     postTitle: postTitle,
                                     postText: postText,
                                     postType: postType,
                                     status: status,
                                     latestUpdateText: latestUpdateText,
                                     latestUpdateDatePosted: latestUpdateDatePosted,
                                     latestUpdateType: latestUpdateType,
                                     privacy: privacy,
                                     isPinned: isPinned)
            }
        } catch {
            throw error
        }
        
        return prayerRequest
    }
        
    // this function enables the creation and submission of a new prayer request. It does three things: 1) add to user collection of prayer requests, 2) add to prayer requests collection, and 3) adds the prayer request to all friends of the person only if the prayer request is the user's main profile.
    func createPrayerRequest(userID: String, datePosted: Date, person: Person, postText: String, postTitle: String, privacy: String, postType: String, friendsList: [String]) {
        
//        var isMyProfile: Bool
//        if person.username != "" && person.userID == userID {
//            isMyProfile = true
//        } else {
//            isMyProfile = false
//        } // this checks whether the prayer request is for yourself, or for a local person that you are praying for.
//        
        // Create new PrayerRequestID to users/{userID}/prayerList/{person}/prayerRequests
        let ref = db.collection("users").document(userID).collection("prayerList").document("\(person.firstName.lowercased())_\(person.lastName.lowercased())").collection("prayerRequests").document()

        ref.setData([
            "datePosted": datePosted,
            "firstName": person.firstName,
            "lastName": person.lastName,
            "status": "Current",
            "prayerRequestText": postText,
            "postType": postType,
            "userID": userID,
            "username": person.username,
            "privacy": privacy,
            "prayerRequestTitle": postTitle,
            "latestUpdateText": "",
            "latestUpdateDatePosted": datePosted,
            "latestUpdateType": ""
        ])
        
        let prayerRequestID = ref.documentID
        
        // Add PrayerRequestID to prayerFeed/{userID}
//        if isMyProfile == true { // removing this logic as of May 25, 2024. Now your prayer requests will update your feed as well.
        if privacy == "public" && friendsList.isEmpty == false {
            for friendID in friendsList {
                let ref2 = db.collection("prayerFeed").document(friendID).collection("prayerRequests").document(prayerRequestID)
                ref2.setData([
                    "datePosted": datePosted,
                    "firstName": person.firstName,
                    "lastName": person.lastName,
                    "status": "Current",
                    "prayerRequestText": postText,
                    "postType": postType,
                    "userID": userID,
                    "username": person.username,
                    "privacy": privacy,
                    "prayerRequestTitle": postTitle,
                    "latestUpdateText": "",
                    "latestUpdateDatePosted": datePosted,
                    "latestUpdateType": ""
                ])
            } // If you have friends and have set privacy to public, this will update all friends feeds.
        }
        let ref2 = db.collection("prayerFeed").document(userID).collection("prayerRequests").document(prayerRequestID)
        ref2.setData([
            "datePosted": datePosted,
            "firstName": person.firstName,
            "lastName": person.lastName,
            "status": "Current",
            "prayerRequestText": postText,
            "postType": postType,
            "userID": userID,
            "username": person.username,
            "privacy": privacy,
            "prayerRequestTitle": postTitle,
            "latestUpdateText": "",
            "latestUpdateDatePosted": datePosted,
            "latestUpdateType": ""
        ]) // if the prayer is for a local user, it will update your own feed.
        
        // Add PrayerRequestID and Data to prayerRequests/{prayerRequestID}
        let ref3 =
        db.collection("prayerRequests").document(prayerRequestID)
        
        ref3.setData([
            "datePosted": datePosted,
            "firstName": person.firstName,
            "lastName": person.lastName,
            "status": "Current",
            "prayerRequestText": postText,
            "postType": postType,
            "userID": userID,
            "username": person.username,
            "privacy": privacy,
            "prayerRequestTitle": postTitle,
            "latestUpdateText": "",
            "latestUpdateDatePosted": datePosted,
            "latestUpdateType": ""
        ])
    }
    
    // This function enables an edit to a prayer requests off of a selected prayer request.
    func editPrayerRequest(prayerRequest: Post, person: Person, friendsList: [String]) {
        
        var isMyProfile: Bool
        if person.username != "" && person.userID == prayerRequest.userID {
            isMyProfile = true
        } else {
            isMyProfile = false
        } // this checks whether the prayer request is for yourself, or for a local person that you are praying for.
        
        let ref = db.collection("users").document(person.userID).collection("prayerList").document("\(prayerRequest.firstName.lowercased())_\(prayerRequest.lastName.lowercased())").collection("prayerRequests").document(prayerRequest.id)
        
        ref.updateData([
            "datePosted": prayerRequest.date,
            "status": prayerRequest.status,
            "postType": prayerRequest.postType,
            "prayerRequestText": prayerRequest.postText,
            "privacy": prayerRequest.privacy,
            "prayerRequestTitle": prayerRequest.postTitle
        ])
        
        // Add PrayerRequestID to prayerFeed/{userID}
        if prayerRequest.status == "No Longer Needed" {
            deleteRequestFromFeed(prayerRequest: prayerRequest, person: person, friendsList: friendsList) // If it is no longer needed, remove from all feeds. If not, update all feeds.
        } else {
            if prayerRequest.privacy == "public" && friendsList.isEmpty == false {
                for friendID in friendsList {
                    updatePrayerFeed(prayerRequest: prayerRequest, person: person, friendID: friendID, updateFriend: true)
                }
            } 
            updatePrayerFeed(prayerRequest: prayerRequest, person: person, friendID: "", updateFriend: false)
            
            // Add PrayerRequestID and Data to prayerRequests/{prayerRequestID}
            updatePrayerRequestsDataCollection(prayerRequest: prayerRequest, person: person)
            print(prayerRequest.postText)
        }
    }
    
    // This function updates the prayer feed of all users who are friends of the person.
    func updatePrayerFeed(prayerRequest: Post, person: Person, friendID: String, updateFriend: Bool) {
        if updateFriend == true {
            let ref = db.collection("prayerFeed").document(friendID).collection("prayerRequests").document(prayerRequest.id)
            ref.setData([
                "datePosted": prayerRequest.date,
                "firstName": prayerRequest.firstName,
                "lastName": prayerRequest.lastName,
                "status": prayerRequest.status,
                "prayerRequestText": prayerRequest.postText,
                "postType": prayerRequest.postType,
                "userID": person.userID,
                "username": person.username,
                "privacy": prayerRequest.privacy,
                "prayerRequestTitle": prayerRequest.postTitle,
                "latestUpdateText": prayerRequest.latestUpdateText,
                "latestUpdateDatePosted": prayerRequest.latestUpdateDatePosted,
                "latestUpdateType": prayerRequest.latestUpdateType
            ])
            print(prayerRequest.id)
            print(friendID)
        } else {
            let ref = db.collection("prayerFeed").document(person.userID).collection("prayerRequests").document(prayerRequest.id)
            ref.setData([
                "datePosted": prayerRequest.date,
                "firstName": prayerRequest.firstName,
                "lastName": prayerRequest.lastName,
                "status": prayerRequest.status,
                "prayerRequestText": prayerRequest.postText,
                "postType": prayerRequest.postType,
                "userID": person.userID,
                "username": person.username,
                "privacy": prayerRequest.privacy,
                "prayerRequestTitle": prayerRequest.postTitle,
                "latestUpdateText": prayerRequest.latestUpdateText,
                "latestUpdateDatePosted": prayerRequest.latestUpdateDatePosted,
                "latestUpdateType": prayerRequest.latestUpdateType,
                "isPinned": prayerRequest.isPinned
            ])
        }
    }
    
    // this function updates the prayer requests collection carrying all prayer requests. Takes in the prayer request being updated, and the person who is being updated for.
    func updatePrayerRequestsDataCollection(prayerRequest: Post, person: Person) {
        let ref =
        db.collection("prayerRequests").document(prayerRequest.id)
        
        ref.updateData([
            "datePosted": prayerRequest.date,
            "firstName": prayerRequest.firstName,
            "lastName": prayerRequest.lastName,
            "status": prayerRequest.status,
            "postType": prayerRequest.postType,
            "prayerRequestText": prayerRequest.postText,
            "userID": person.userID,
            "username": person.username,
            "privacy": prayerRequest.privacy,
            "prayerRequestTitle": prayerRequest.postTitle
        ])
    }
    
    //person passed in for the feed is the user. prayer passed in for the profile view is the person being viewed.
    func deletePrayerRequest(prayerRequest: Post, person: Person, friendsList: [String]) {
        let ref = db.collection("users").document(person.userID).collection("prayerList").document("\(prayerRequest.firstName.lowercased())_\(prayerRequest.lastName.lowercased())").collection("prayerRequests").document(prayerRequest.id)
        
        ref.delete() { err in
            if let err = err {
                print("Error removing document: \(err)")
            } else {
                print("Document successfully deleted")
                print(prayerRequest.id)
                print(prayerRequest.postText)
            }
        }
        
        // Delete PrayerRequest from all feeds: friend feeds and user's feed.
        deleteRequestFromFeed(prayerRequest: prayerRequest, person: person, friendsList: friendsList)
        
        // Delete PrayerRequestID and Data from prayerRequests/{prayerRequestID}
        let ref3 =
        db.collection("prayerRequests").document(prayerRequest.id)
        
        ref3.delete()
    }
    
    // This function is used only for deleting from prayer feed. ie. No longer needed, or deleted prayer request.
    func deleteRequestFromFeed(prayerRequest: Post, person: Person, friendsList: [String]) {
        var isMyProfile: Bool
        if person.username != "" && person.userID == prayerRequest.userID {
            isMyProfile = true
        } else {
            isMyProfile = false
        }
    
        // Delete PrayerRequestID from prayerFeed/{userID}
//        if isMyProfile == true {
        if prayerRequest.privacy == "public" && friendsList.isEmpty == false {
            for friendID in friendsList {
                let ref2 = db.collection("prayerFeed").document(friendID).collection("prayerRequests").document(prayerRequest.id)
                ref2.delete() { err in
                    if let err = err {
                        print("Error removing document: \(err)")
                    } else {
                        print("Document successfully deleted")
                        print(prayerRequest.id)
                        print(prayerRequest.postText)
                    }
                }
            }
        } // Delete from your friends' feeds.
        
        // Delete from your own user feed.
        let ref2 = db.collection("prayerFeed").document(person.userID).collection("prayerRequests").document(prayerRequest.id)
        ref2.delete() { err in
            if let err = err {
                print("Error removing document: \(err)")
            } else {
                print("Document successfully deleted")
                print(prayerRequest.id)
                print(prayerRequest.postText)
            }
        }
    }
    
    func togglePinned(person: Person, prayerRequest: Post, toggle: Bool) {
        let ref = db.collection("prayerFeed").document(person.userID).collection("prayerRequests").document(prayerRequest.id)
        ref.updateData([
            "isPinned": toggle
        ])
        
        if person.userID == prayerRequest.userID {
            let ref2 = db.collection("users").document(person.userID).collection("prayerList").document("\(person.firstName.lowercased())_\(person.lastName.lowercased())").collection("prayerRequests").document(prayerRequest.id)
            ref.updateData([
                "isPinned": toggle
            ])
        } // update data to personal profile feed if this is under your profile as well.
    }
    
    func publicToPrivate(prayerRequest: Post, friendsList: [String]) {
        if friendsList.isEmpty == false {
            for friendID in friendsList {
                let ref2 = db.collection("prayerFeed").document(friendID).collection("prayerRequests").document(prayerRequest.id)
                ref2.delete() { err in
                    if let err = err {
                        print("Error removing document: \(err)")
                    } else {
                        print("Document successfully deleted")
                        print(prayerRequest.id)
                        print(prayerRequest.postText)
                    }
                }
            }
        }
    } // This function allows you to pass in a prayer request and delete that from friends' feeds if you have changed it from public to private.
}
