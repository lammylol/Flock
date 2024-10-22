 //
//  UserProfileHolder.swift
//  Prayer Calendar
//
//  Created by Matt Lam on 11/26/23.
//

import Foundation
import SwiftUI
import FirebaseAuth
import FirebaseFirestore

@Observable class UserProfileHolder {
    // after sign-in, the 'person' will include userID, username, firstName, and lastName
    var person: Person = Person(username: "")
    var userPassword: String = ""
    var refresh: Bool = false
    var viewState: ViewState?
    var prayerList: String = ""
    var prayerListArray: [Person] = []
    var prayStartDate = Date()
    var email: String = ""
    
    var profileViewIsLoading: Bool = false
    
    var draftPost: DraftPost?

    var isLoading: Bool {
        viewState == .loading
    }
    
    var isFetching: Bool {
        viewState == .fetching
    }
    
    var isFinished: Bool {
        viewState == .finished
    }
    
    var isLoggedIn: Authenticated = .undefined
    
    init() {
        if Auth.auth().currentUser == nil {
            isLoggedIn = .notAuthenticated
            person = Person(username: "")
        } else {
            isLoggedIn = .authenticated
        }
        
        Auth.auth().addStateDidChangeListener { auth, user in
            self.isLoggedIn = user != nil ? .authenticated : .notAuthenticated
        }
    }
    
    @MainActor
    func resetUserProfileHolder() {
        person = Person()
        userPassword = ""
        prayerList = ""
        prayerListArray = []
        prayStartDate = Date()
        email = ""
    }
}

extension UserProfileHolder {
    struct DraftPost {
        var title: String
        var content: String
        var selectedTags: [String]
    }
}

extension UserProfileHolder {
    @Observable class Blank {
        var person: Person = Person(userID: "", username: "lammylol", email: "matthewthelam@gmail.com", firstName: "Matt", lastName: "Lam")
        var isLoggedIn: Bool = true
        var friendsList: [String] = []
        var userPassword: String = "abcdefghjikdas"
    }
}

extension UserProfileHolder {
    enum ViewState {
        case fetching
        case loading
        case finished
    }
    
    enum Authenticated {
        case undefined
        case authenticated
        case notAuthenticated
    }
}

@Observable class DateHolder {
    var date = Date()
}
