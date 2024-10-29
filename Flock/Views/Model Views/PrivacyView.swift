//
//  PrivacyView.swift
//  Prayer Calendar
//
//  Created by Matt Lam on 5/24/24.
//

import SwiftUI

struct PrivacyView: View {
    @Environment(UserProfileHolder.self) var userHolder
    var person: Person
    let privacyOptions = Privacy.allCases
    @Binding var privacySetting: String
    
    var body: some View {
        Menu {
            if person.isPublic, userHolder.person.firstName.lowercased() == person.firstName.lowercased(), userHolder.person.lastName.lowercased() == person.lastName.lowercased() { // this would mean this is your own profile. You should only be able to set public and private settings for your own prayer requests.
                ForEach(privacyOptions) { privacy in
                    Button {
                        privacySetting = privacy.statusKey
                    } label: {
                        HStack{
                            privacy.systemImage
                            Text(privacy.statusKey.capitalized)
                        }
                    }
                }
            } else {
                ForEach(privacyOptions.dropFirst()) { privacy in //drop first disables 'public' option for prayer requests that you are submitting for another person.
                    Button {
                        privacySetting = privacy.statusKey
                    } label: {
                        HStack{
                            privacy.systemImage
                            Text(privacy.statusKey.capitalized)
                        }
                    }
                }
            }
        } label: {
            HStack{
                if person.username != "" && person.userID == userHolder.person.userID {
                    Privacy(rawValue: privacySetting)?.systemImage
                    Text(privacySetting.capitalized)
                } else {
                    Privacy(rawValue: "private")?.systemImage
                    Text("Private")
                }
            }
        }
    }
}
//
//#Preview {
//    PrivacyView()
//}
