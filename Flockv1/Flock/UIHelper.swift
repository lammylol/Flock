//
//  UIHelper.swift
//  Prayer Calendar
//
//  Created by Matt Lam on 11/8/23.
//

import Foundation
import SwiftUI

class UIHelper {
    
    func backgroundColor(colorScheme: ColorScheme) -> Color {
        if colorScheme == .light {
            return Color.white
        } else {
            return Color.black
        }
    }
    
    func backgroundColorReversed(colorScheme: ColorScheme) -> Color {
        if colorScheme == .dark {
            return Color.white
        } else {
            return Color.black
        }
    }
    
    func textColor(colorScheme: ColorScheme) -> Color {
        if colorScheme == .dark {
            return .white
        } else {
            return .black
        }
    }
}
