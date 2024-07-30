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
    
    func updatePostListData(userID: String, prayStartDate: Date, prayerList: String) async throws {
        // This function enables the user to update user documentation with userID, prayer start date, and prayer list.
        let ref = db.collection("users").document(userID)
        try await ref.updateData([
            "userID": userID,
            "prayStartDate": prayStartDate,
            "prayerList": prayerList
        ])
    }
}