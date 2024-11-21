//
//  PrayerRequest.swift
//  Prayer Calendar
//
//  Created by Matt Lam on 11/10/23.
//

import Foundation
import SwiftUI

struct Post: Identifiable, Observable, Hashable, Codable { // Add Codable here
    var id: String = ""
    var date: Date = Date()
    var userID: String = ""
    var username: String = ""
    var firstName: String = ""
    var lastName: String = ""
//    var friendType: Person.FriendType = .user
    var postTitle: String = ""
    var postText: String = ""
    var postType: PostType = .note
    var status: Status = .current
    var latestUpdateText: String = ""
    var latestUpdateDatePosted: Date = Date()
    var latestUpdateType: String = ""
    var privacy: Privacy = .isPrivate
    var isPinned: Bool = false
    var lastSeenNotificationCount: Int = 0

    enum CodingKeys: String, CodingKey {
        case id
        case date
        case userID
        case username
        case firstName
        case lastName
//        case friendType
        case postTitle
        case postText
        case postType
        case status
        case latestUpdateText
        case latestUpdateDatePosted
        case latestUpdateType
        case privacy
        case isPinned
        case lastSeenNotificationCount
    }
    
    var person: Person {
        Person(
            userID: userID,
            username: username,
            firstName: firstName,
            lastName: lastName
        )
    }
}

extension Post {
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
            postType: .note,
            status: .current,
            latestUpdateText: "",
            latestUpdateDatePosted: Date(),
            latestUpdateType: "Update",
            privacy: .isPrivate,
            isPinned: false
        )
        return item
    }
    
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
            postType: .note,
            status: .current,
            latestUpdateText: "Hearing God There is no way that God who spoke to people all throughout history would so as soon as the Bible came into being. The Bible is the word but it’s not everything. God is active. My sheep hear my voice. Everyone who is a follower of Christ has heard the voice of God. It’s not just some people who hear him. It’s all. Samuel hearing God. Man should not live by bread alone but by by every WORD (Rhema) that comes from the mouth of God. The hearing voice.Spirit, soul, and body. 1 Thessalonians 5:19-23. Be led by the spirit and have that have the throne of your heart. Not your soul (mind, emotions, etc.) or your body (the flesh). So fast to help focus on being led by the spirit. We don’t want our will over someone else’s life. We want God’s will. Dreams are in a way the modern day version or parables. Jesus used parables to take something that is relevant to that society to show something. So if he uses something (movie you just watched), then don’t discount it cause he can be using it to teach you.You are a magician. Me saying to God he is so good, so merciful, so beautiful, so gracious - and him coming back and saying “that is who you are too",
            latestUpdateDatePosted: Date(),
            latestUpdateType: "Update",
            privacy: .isPrivate,
            isPinned: true,
            lastSeenNotificationCount: 1
        )
        return item
    }
}

extension Post {
    enum PostType: String, CaseIterable, Codable {
        case note = "Note"
        case prayerRequest = "Prayer Request"
        case praise = "Praise"
        
        var descriptionKey: String {
            return self.rawValue.description
        }
    }
    
    enum Status: String, CaseIterable, Codable {
        case noLongerNeeded = "No Longer Needed"
        case answered = "Answered"
        case current = "Current"
        
        var descriptionKey: String {
            return self.rawValue.description
        }
    }
    
    enum Privacy: String, CaseIterable, Identifiable, Codable {
        var id: Self {
            return self
        }
        
        case isPublic = "public"
        case isPrivate = "private"
        
        var descriptionKey: String {
            return self.rawValue.description
        }
        
        var systemImage: Image {
            switch self {
                case .isPublic:
                    return Image(systemName: "globe.europe.africa.fill")
                case .isPrivate:
                    return Image(systemName: "lock.fill")
            }
        }
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
