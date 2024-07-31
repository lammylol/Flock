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
