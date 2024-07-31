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
    var isPublic: Bool {
        username != ""
    }
    var friendState: String = ""
}

extension Person {
    static var blank: Person {
        let item =
        Person(username: "")
        return item
    }
    
    static var preview: Person {
        let item =
        Person(username: "matthewthelam@gmail.com", firstName: "Matt", lastName: "Lam", friendState: "pending")
        return item
    }
}
