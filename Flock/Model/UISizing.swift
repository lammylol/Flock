//
//  UISizing.swift
//  Flock
//
//  Created by Matt Lam on 10/9/24.
//

import Foundation
import UIKit

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
