//
//  PrayerRequest.swift
//  Prayer Calendar
//
//  Created by Matt Lam on 11/10/23.
//

import Foundation
import SwiftUI

struct Post : Identifiable, Observable, Hashable {
    var id: String = ""
    var date: Date = Date()
    var userID: String = ""
    var username: String = ""
    var firstName: String = ""
    var lastName: String = ""
    var postTitle: String = ""
    var postText: String = ""
    var postType: String = "Note"
    var status: String = ""
    var latestUpdateText: String = ""
    var latestUpdateDatePosted: Date = Date()
    var latestUpdateType: String = ""
    var privacy: String = ""
    var isPinned: Bool = false
    var lastSeenNotificationCount: Int = 0
}

extension Post {
    static var preview: Post {
        let item =
        Post(
            id: UUID().uuidString,
            date: Date(),
            userID: "Matt",
            username: "lammylol",
            firstName: "Matt",
            lastName: "Lam",
            postTitle: "Test this is Title Prayers for Random Things",
            postText: "Hearing God There is no way that God who spoke to people all throughout history would so as soon as the Bible came into being.\nThe Bible is the word but it’s not everything. God is active. My sheep hear my voice. Everyone who is a follower of Christ has heard the voice of God. It’s not just some people who hear him. It’s all. \nSamuel hearing God. Man should not live by bread alone but by by every WORD (Rhema) that comes from the mouth of God. The hearing voice.Spirit, soul, and body. 1 Thessalonians 5:19-23. Be led by the spirit and have that have the throne of your heart. Not your soul (mind, emotions, etc.) or your body (the flesh).\nSo fast to help focus on being led by the spirit. We don’t want our will over someone else’s life. We want God’s will. Dreams are in a way the modern day version or parables. Jesus used parables to take something that is relevant to that society to show something. So if he uses something (movie you just watched), then don’t discount it cause he can be using it to teach you.You are a magician. Me saying to God he is so good, so merciful, so beautiful, so gracious - and him coming back and saying “that is who you are too",
            postType: "note",
            status: "Current",
            latestUpdateText: "Hearing God There is no way that God who spoke to people all throughout history would so as soon as the Bible came into being. The Bible is the word but it’s not everything. God is active. My sheep hear my voice. Everyone who is a follower of Christ has heard the voice of God. It’s not just some people who hear him. It’s all. Samuel hearing God. Man should not live by bread alone but by by every WORD (Rhema) that comes from the mouth of God. The hearing voice.Spirit, soul, and body. 1 Thessalonians 5:19-23. Be led by the spirit and have that have the throne of your heart. Not your soul (mind, emotions, etc.) or your body (the flesh). So fast to help focus on being led by the spirit. We don’t want our will over someone else’s life. We want God’s will. Dreams are in a way the modern day version or parables. Jesus used parables to take something that is relevant to that society to show something. So if he uses something (movie you just watched), then don’t discount it cause he can be using it to teach you.You are a magician. Me saying to God he is so good, so merciful, so beautiful, so gracious - and him coming back and saying “that is who you are too",
            latestUpdateDatePosted: Date(),
            latestUpdateType: "Update",
            privacy: "private",
            isPinned: true,
            lastSeenNotificationCount: 1
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
            postType: "note",
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

extension Post {
    enum PostType: String, CaseIterable {
        case note = "Note"
        case prayerRequest = "Prayer Request"
        case praise = "Praise"
    }
}

// MARK: - PostUpdates

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
    
    static var postUpdates: [PostUpdate] {
        let item =
            [PostUpdate(
                id: UUID().uuidString,
                datePosted: Date(),
                prayerUpdateText: "Hearing God There is no way that God who spoke to people all throughout history would so as soon as the Bible came into being. The Bible is the word but it’s not everything. God is active. My sheep hear my voice. Everyone who is a follower of Christ has heard the voice of God. It’s not just some people who hear him. It’s all. Samuel hearing God. Man should not live by bread alone but by by every WORD (Rhema) that comes from the mouth of God. The hearing voice.Spirit, soul, and body. 1 Thessalonians 5:19-23. Be led by the spirit and have that have the throne of your heart. Not your soul (mind, emotions, etc.) or your body (the flesh). So fast to help focus on being led by the spirit. We don’t want our will over someone else’s life. We want God’s will. Dreams are in a way the modern day version or parables. Jesus used parables to take something that is relevant to that society to show something. So if he uses something (movie you just watched), then don’t discount it cause he can be using it to teach you.You are a magician. Me saying to God he is so good, so merciful, so beautiful, so gracious - and him coming back and saying “that is who you are too",
                updateType: "Update"),
            PostUpdate(
                id: UUID().uuidString,
                datePosted: Date(),
                prayerUpdateText: "Hello World, this is a test.",
                updateType: "Testimony"),
             PostUpdate(
                id: UUID().uuidString,
                 datePosted: Date(),
                 prayerUpdateText: "Woah",
                 updateType: "Testimony")]
        return item
    }
}
