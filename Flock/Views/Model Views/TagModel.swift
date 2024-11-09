//
//  TagModel.swift
//  Flock
//
//  Created by Matt Lam on 9/8/24.
//

import SwiftUI

struct TagModelView: View {
    var textLabel: String
    var systemImage: String = ""
    var textSize: CGFloat
    var foregroundColor: Color
    var backgroundColor: Color
    var opacity: CGFloat = 1.00
    var boldBool: Bool = true
    var cornerRadius: CGFloat = 5
    
    var body: some View {
        HStack {
            if boldBool {
                Text(textLabel)
                    .font(.system(size: textSize))
                    .bold()
            } else {
                Text(textLabel)
                    .font(.system(size: textSize))
            }
            if systemImage != "" {
                Image(systemName: systemImage)
                    .imageScale(.small)
                    .padding([.horizontal], -3)
            }
        }
        .padding([.vertical], 5)
        .padding([.horizontal], 10)
        .background {
            RoundedRectangle(cornerRadius: cornerRadius)
                .fill(backgroundColor)
                .opacity(opacity)
        }
        .foregroundStyle(foregroundColor)
    }
}
