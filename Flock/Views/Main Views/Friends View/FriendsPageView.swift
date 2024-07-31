//
//  FriendsPageView.swift
//  Flock
//
//  Created by Matt Lam on 7/30/24.
//

import SwiftUI

struct FriendsPageView: View {
    var friendsList: [Person] = []
    
    var body: some View {
        NavigationStack {
            ScrollView {
                VStack {
                    List(friendsList) { friend in
                        ContactRow(person: friend)
                    }
                }
            }
            .navigationTitle("Friends")
            .navigationBarTitleDisplayMode(.automatic)
        }
    }
}

#Preview {
    FriendsPageView(friendsList: [Person.preview, Person.preview])
}
