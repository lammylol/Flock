//
//  MonthStruct.swift
//  PrayerCalendarSwift
//
//  Created by Matt Lam on 9/27/23.
//

import SwiftUI
import Foundation

struct MonthStruct {
    var monthType: MonthType
    var dayInt: Int
//    var prayerName: String
    var prayerRange: Int
//    var prayerUsername: String
    
    var person: Person
    
    func day() -> String {
        return String(dayInt)
    }
    
    func name() -> String {
        return person.firstName
    }
    
    func prange() -> String {
        return String(prayerRange)
    }
}

enum MonthType {
    case Previous
    case Current
    case Next
}


