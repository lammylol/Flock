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
    case isPrivate = "private"
    
    var statusKey: String {
        return self.rawValue.description
    }
    
    var displayName: String { // temporary while testing friends.
        switch self {
        case .isPublic: return "friends"
        case .isPrivate: return "private"
        }
    }
    
    var systemImage: Image {
        switch self {
            case .isPublic:
                return Image(systemName: "person.2.fill")
            case .isPrivate:
                return Image(systemName: "lock.fill")
        }
    }
}
