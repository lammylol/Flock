//
//  PrayerPerson.swift
//  Prayer Calendar
//
//  Created by Matt Lam on 11/23/23.
//

import Foundation

struct Person: Hashable {
    var userID: String = ""
    var username: String = ""
    var email: String = ""
    var firstName: String = ""
    var lastName: String = ""
}

extension Person {
    static var blank: Person {
        let item =
        Person(username: "")
        return item
    }
    
    static var preview: Person {
        let item =
        Person(username: "matthewthelam@gmail.com", firstName: "Matt", lastName: "Lam")
        return item
    }
}
