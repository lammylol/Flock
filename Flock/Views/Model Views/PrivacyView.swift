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
    let privacyOptions = Post.Privacy.allCases
    @Binding var privacySetting: Post.Privacy
    
    var body: some View {
        Menu {
            if person.friendType == .user { // this would mean this is your own profile. You should only be able to set public and private settings for your own prayer requests.
                ForEach(privacyOptions) { privacy in
                    Button {
                        privacySetting = privacy
                    } label: {
                        HStack{
                            privacy.systemImage
                            Text(privacy.descriptionKey.capitalized)
                        }
                    }
                }
            } else {
                ForEach(privacyOptions.dropFirst()) { privacy in //drop first disables 'public' option for prayer requests that you are submitting for another person.
                    Button {
                        privacySetting = privacy
                    } label: {
                        HStack{
                            privacy.systemImage
                            Text(privacy.descriptionKey.capitalized)
                        }
                    }
                }
            }
        } label: {
            HStack{
                if person.username != "" && person.userID == userHolder.person.userID {
                    privacySetting.systemImage
                    Text(privacySetting.descriptionKey.capitalized)
                } else {
                    Post.Privacy(rawValue: "private")?.systemImage
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
