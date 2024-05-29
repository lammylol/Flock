//
//  PrayerRequest.swift
//  Prayer Calendar
//
//  Created by Matt Lam on 11/10/23.
//

import Foundation

struct Post : Identifiable, Observable, Hashable {
    var id: String = ""
    var date: Date
    var userID: String
    var username: String
    var firstName: String
    var lastName: String
    var postTitle: String
    var postText: String
    var postType: String
    var status: String
    var latestUpdateText: String
    var latestUpdateDatePosted: Date
    var latestUpdateType: String
    var privacy: String
    var isPinned: Bool
}

extension Post {
    static var preview: Post {
        let item =
        Post(
            date: Date(),
            userID: "Matt",
            username: "lammylol",
            firstName: "Matt",
            lastName: "Lam",
            postTitle: "Test this is Title djaskldjklsajdklasjdklasjdklajsdlkasjdklajdklajdklajsdklasjdklasjdklasjdaklsdjaldjklad",
            postText: "Hello, World ajsdklasjdklasjdklasjdklasjdklasjdklasjdklasjdklasjdklasjdklasjdklasjdklasjdklasjdklasjldkjas",
            postType: "Testimony",
            status: "Current",
            latestUpdateText: "Test Latest Update.",
            latestUpdateDatePosted: Date(), 
            latestUpdateType: "Update",
            privacy: "private",
            isPinned: true
        )
        return item
    }
    
    static var blank: Post {
        let item =
        Post(
            date: Date(),
            userID: "",
            username: "",
            firstName: "",
            lastName: "",
            postTitle: "",
            postText: "",
            postType: "",
            status: "",
            latestUpdateText: "",
            latestUpdateDatePosted: Date(),
            latestUpdateType: "Update",
            privacy: "",
            isPinned: false
        )
        return item
    }
}

struct PostUpdate : Identifiable {
    var id: String = ""
    var postID: String = "" // original identifier
    var datePosted: Date
    var prayerUpdateText: String
    var updateType: String
}

extension PostUpdate {
    static var blank: PostUpdate {
        let item =
        PostUpdate(
            postID: "",
            datePosted: Date(),
            prayerUpdateText: "",
            updateType: "Update")
        return item
    }
}
