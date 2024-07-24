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
