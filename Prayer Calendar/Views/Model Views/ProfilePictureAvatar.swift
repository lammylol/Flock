//
//  ProfilePictureAvatar.swift
//  Prayer Calendar
//
//  Created by Matt Lam on 1/29/24.
//

import SwiftUI

struct ProfilePictureAvatar: View {
    
    @Environment(\.colorScheme) var colorScheme
    
    let firstName: String
    let lastName: String
    let imageSize: CGFloat
    let fontSize: CGFloat

    var body: some View {
        HStack {
            let name = (firstName.first?.uppercased() ?? "") + (lastName.first?.uppercased() ?? "")
            ZStack {
                Circle()
                    .frame(width: imageSize, height: imageSize)
                Text(name)
                    .foregroundStyle(textColor())
                    .font(.system(size: fontSize))
                    .bold()
            }
        }
//        .shadow(radius: 10)
    }
    
    func textColor() -> Color {
        if colorScheme == .light {
            return Color.white
        } else {
            return Color.black
        }
    }
}

#Preview {
    ProfilePictureAvatar(firstName: "Matt", lastName: "Lam", imageSize: 200, fontSize: 20)
}


