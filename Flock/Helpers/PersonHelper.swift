//
//  PrayerNameHelper.swift
//  Prayer Calendar
//
//  Created by Matt Lam on 11/23/23.

import Foundation
import SwiftUI
import FirebaseFirestore
import FirebaseAuth

enum PrayerPersonRetrievalError: Error {
    case noUsername
    case incorrectUsername
    case errorRetrievingFromFirebase
    case noUserID
}

class PersonHelper { // This class provides functions to retrieve, edit, and delete user profile data.
    
    let db = Firestore.firestore() // initiaties Firestore
    
    // Functions used at login: getPrayerList(), retrievePrayerPersonArray(), getUserInfo()
    

    
    
    
    
}
