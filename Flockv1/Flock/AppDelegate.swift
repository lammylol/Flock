//
//  AppDelegate.swift
//  Flock
//
//  Created by Preston Mar on 10/10/24.
//

import UIKit
import FirebaseCore

class AppDelegate: NSObject, UIApplicationDelegate {
    func application(_ application: UIApplication,
                     didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
        // Initialize Firebase
        FirebaseApp.configure()
        return true
    }

    // Other app delegate methods as needed
}
