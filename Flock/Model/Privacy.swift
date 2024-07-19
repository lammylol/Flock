//
//  Privacy.swift
//  Prayer Calendar
//
//  Created by Matt Lam on 5/14/24.
//

import Foundation
import SwiftUI

enum Privacy: String, CaseIterable, Identifiable {
    var id: Self {
        return self
    }
    
    case isPublic = "public"
    // TODO mattlam
    //    case isFriends = "Friends" -- to be added later
    case isPrivate = "private"
    
    var statusKey: String {
        return self.rawValue.description
    }
    
    var systemImage: Image {
        switch self {
            case .isPublic:
                return Image(systemName: "globe.europe.africa.fill")
        // TODO mattlam
        //    case .isFriends:
        //        return Image(systemName: "person.2.fill")
            case .isPrivate:
                return Image(systemName: "lock.fill")
        }
    }
}
