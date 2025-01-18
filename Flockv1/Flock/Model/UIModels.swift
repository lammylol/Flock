//
//  UISizing.swift
//  Flock
//
//  Created by Matt Lam on 10/9/24.
//

import Foundation
import UIKit
import SwiftUI

@Observable class UISizing {
    var view: UIView = UIView()
    var screenSize: ScreenSize {
        ScreenSize(view: view)
    }

    struct ScreenSize {
        var view: UIView
        
        var screenHeight: CGFloat {
            return view.window?.screen.bounds.height ?? 0
        }
        
        var screenWidth: CGFloat {
            return view.window?.screen.bounds.width ?? 0
        }
    }
    
    struct PostCard {
        var smallVsLarge: Bool
        
        var insideFrameHeight: CGFloat {
            smallVsLarge ? 100 : 120
        }
        var outsideFrameHeight: CGFloat { insideFrameHeight * 1.5 }
        var width: CGFloat {
            smallVsLarge ? 80 : 100
        }
    }
}

extension Color {
    static var random: Color {
        let colors = [
            Color
            .red,
            .green,
            .blue,
            .orange,
//            .yellow,
            .pink,
            .purple,
//            .gray,
            .black,
//            .primary,
            .secondary,
            .accentColor,
            .primary.opacity(0.75),
            .secondary.opacity(0.75),
            .accentColor.opacity(0.75)
        ]
        return colors.randomElement()!
    }
}
