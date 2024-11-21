//
//  PrayerPerson.swift
//  Prayer Calendar
//
//  Created by Matt Lam on 11/23/23.
//

import Foundation

struct Person: Identifiable, Hashable {
    var id: UUID = UUID()
    var userID: String = ""
    var username: String = ""
    var email: String = ""
    var firstName: String = ""
    var lastName: String = ""
    var fullName: String {
        firstName + " " + lastName
    }
    var friendState: FriendState = .none
}

extension Person {
    enum FriendType: String, CaseIterable, Codable {
        case user = "user"
        case publicFriend = "publicFriend"
        case privateFriend = "privateFriend"
        case none = ""
        
        var descriptionKey: String {
            return self.rawValue.description
        }
    }
    
    enum FriendState: String, CaseIterable,  Codable {
        case sent = "sent"
        case pending = "pending"
        case approved = "approved"
        case none = ""
        
        var descriptionKey: String {
            return self.rawValue.description
        }
    }
    
    static var blank: Person {
        let item =
        Person(username: "")
        return item
    }
    
    static var preview: Person {
        let item =
        Person(username: "matthewthelam@gmail.com", firstName: "Matt", lastName: "Lam", friendState: .pending)
        return item
    }
}
