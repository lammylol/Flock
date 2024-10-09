//
//  FirebaseErrors.swift
//  Flock
//
//  All errors related to firebase
//
//  Created by Preston Mar on 7/22/24.
//

import Foundation

enum PersonRetrievalError: Error {
    case noUsername
    case incorrectUsername
    case errorRetrievingFromFirebase
    case noUserID
}

enum PrayerRequestRetrievalError: Error {
    case noUserID
    case noPrayerRequestID
    case noPrayerRequest
    case errorRetrievingFromFirebase
}

enum AddFriendError: LocalizedError {
    case invalidUsername
    case missingName
    case friendAddedAlready
    
    var errorDescription: String? {
        switch self {
        case .invalidUsername:
            return NSLocalizedString("Username invalid. Make sure you have entered a valid username that exists and is not your own.", comment: "Invalid Username")
        case .missingName:
            return NSLocalizedString("Either the first name or last name is blank. Make sure you enter in a value for both first name and last name to add a user.", comment: "Missing First Name or Last Name")
        case .friendAddedAlready:
            return NSLocalizedString("This friend has already been added, or a request is pending.", comment: "Friend Already Exists")
        }
    }
    
    var failureReason: String? {
        switch self {
        case .invalidUsername:
            return NSLocalizedString("Invalid Username", comment: "Invalid Username")
        case .missingName:
            return NSLocalizedString("Missing Name", comment: "Missing Name")
        case .friendAddedAlready:
            return NSLocalizedString("Friend Already Added", comment: "Friend Already Added")
        }
    }
}
