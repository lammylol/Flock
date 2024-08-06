//
//  FirebaseErrors.swift
//  Flock
//
//  All errors related to firebase
//
//  Created by Preston Mar on 7/22/24.
//

import Foundation

enum PrayerPersonRetrievalError: Error {
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
    
    var errorDescription: String? {
        switch self {
        case .invalidUsername:
            return NSLocalizedString("Username not valid. Make sure you have entered a valid username, and make sure it matches the first and last name of the user you are trying to add.", comment: "Invalid Username")
        case .missingName:
            return NSLocalizedString("Either the first name or last name is blank. Make sure you enter in a value for both first name and last name to add a user.", comment: "Missing First Name or Last Name")
        }
    }
    
    var failureReason: String? {
        switch self {
        case .invalidUsername:
            return NSLocalizedString("Invalid Username", comment: "Invalid Username")
        case .missingName:
            return NSLocalizedString("Missing Name", comment: "Missing Name")
        }
    }
}
