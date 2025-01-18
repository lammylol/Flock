//
//  Globals.swift
//  Flock
//
//  Created by Preston Mar on 10/10/24.
//

// Globals.swift

// defined by Swift Flags
let DEVELOPMENT = "dev"
let PRODUCTION = "prod"
let buildConfiguration: String = {
    #if DEBUG
    return DEVELOPMENT
    #elseif PROD
    return PRODUCTION
    #else
    return "Unknown"
    #endif
}()
