//
//  TabBarButton.swift
//  Prayer Calendar
//
//  Created by Matt Lam on 3/29/24.
//

import SwiftUI

struct TabBarButton: View {
    @Environment(\.colorScheme) private var scheme
    
    var type: String
    var isSelected: Bool
    
    var body: some View {
        GeometryReader { geo in
            VStack (alignment: .center) {
                Text(type)
//                    .font(.callout)
                    .bold()
                    .font(.system(size: 16))
                    .foregroundStyle(textColor())
                    .frame(width: geo.size.width, height: geo.size.height)
                    .padding(.vertical, 3)
                
                if isSelected == true {
                    Rectangle()
                        .fill(scheme == .dark ? .white : .gray)
                        .frame(width: geo.size.width * 0.7, height: 2)
                }
            }
        }
    }
    
    func textColor() -> Color {
        if isSelected == true {
            return (scheme == .dark ? .white : .black)
        } else {
            return (scheme == .dark ? .gray : .gray)
        }
    }
}

#Preview {
    TabBarButton(type: "answered", isSelected: true)
}
