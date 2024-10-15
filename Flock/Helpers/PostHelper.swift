//
//  PrayerRequestHelper.swift
//  Prayer Calendar
//
//  Created by Matt Lam on 11/19/23.
//

import Foundation
import FirebaseFirestore

class PostHelper {
    let db = Firestore.firestore()
    
    func togglePinned(person: Person, post: Post, toggle: Bool) async throws {
        let ref = db.collection("prayerFeed").document(person.userID).collection("prayerRequests").document(post.id)
        try await ref.updateData([
            "isPinned": toggle
        ])
        
        if person.userID == post.userID {
            let ref2 = db.collection("users").document(person.userID).collection("prayerList").document("\(post.firstName.lowercased())_\(post.lastName.lowercased())").collection("prayerRequests").document(post.id)
            try await ref2.updateData([
                "isPinned": toggle
            ])
        } // update data to personal profile feed if this is under your profile as well.
    }
    
    
    // Helper function to determine relative time string
    func relativeTimeStringAbbrev(for date: Date) -> String {
        let now = Date()
        let timeInterval = now.timeIntervalSince(date)

        // Check if the time interval is within 24 hours (86400 seconds)
        if timeInterval > 10 && timeInterval < 86400 {
            let formatter = RelativeDateTimeFormatter()
            formatter.unitsStyle = .abbreviated // This will display 'hours ago' when within 24 hours
            return formatter.localizedString(for: date, relativeTo: now)
        } else if timeInterval > 86400 {
            let formatter = DateFormatter()
            formatter.dateStyle = .medium // Shows days, months, years, etc.
            return formatter.string(from: date)
        } else {
            return "just posted"
        }
    }
    
    // Helper function to determine relative time string
    func relativeTimeStringFull(for date: Date) -> String {
        let now = Date()
        let timeInterval = now.timeIntervalSince(date)

        // Check if the time interval is within 24 hours (86400 seconds)
        if timeInterval < 86400 {
            let formatter = RelativeDateTimeFormatter()
            formatter.unitsStyle = .full // This will display 'hours ago' when within 24 hours
            return formatter.localizedString(for: date, relativeTo: now)
        } else {
            let formatter = DateFormatter()
            formatter.dateFormat = "MM/dd/yy"// Shows days, months, years, etc.
            return formatter.string(from: date)
        }
    }
    
    // Helper function to determine relative time string
    func timeStringFull(for date: Date) -> String {
        let formatter = DateFormatter()
        formatter.dateFormat = "h:mma · MM/dd/yy" // Adds a dot between the time and the date
        formatter.amSymbol = "am"
        formatter.pmSymbol = "pm"
        
        return formatter.string(from: date)
    }
}
