//
//  DebounceTextObserver.swift
//  Flock
//
//  Created by Matt Lam on 8/7/24.
//

import Foundation
import Combine
import SwiftUI

// This model acts to enable 'debounce' for text. Mainly used in the add friends page where an API to validate the username is only called after '1' second once the user stops typing. Prevents repeatable api calls.
@MainActor class debounceTextModel : ObservableObject {
    @Published var debouncedText: String = ""
    @Published var username: String = ""
    
    var returnText: String = ""
    @Published var validated: Bool = false
    var person = Person()
    
    private var cancellables = Set<AnyCancellable>()
    var friendService = FriendService()
    
    init() {
        self.$username
            .debounce(for: .seconds(1), scheduler: DispatchQueue.main)
            .removeDuplicates()
            .sink { [weak self] value in
                self?.debouncedText = value
                self?.validate()
            }
            .store(in: &cancellables)
    }
    
    private func validate() {
        Task {
            do {
                if username != "" { // functions only if the username exists (aka profile is public)
                    let ref = try await friendService.validateFriendUsername(username: username) // returns (bool, person)
                    self.validated = ref.0 // true or false if username is validated according to first and last name
                    
                    if validated {
                        self.person = ref.1
                        print("ran user validation. success: \(person.firstName) \(person.lastName)")
                    } else {
                        returnText = "No user found."
                        print("ran user validation. invalid user.")
                    }
                }
            }
        }
    }
}
