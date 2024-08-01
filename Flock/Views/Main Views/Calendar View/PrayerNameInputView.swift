//
//  PrayerNameInputView.swift
//  PrayerCalendar
//
//  Created by Matt Lam on 10/2/23.
//

import SwiftUI
import Observation
import FirebaseFirestore

struct PrayerNameInputView: View {
    @Environment(\.dismiss) private var dismiss
    @Environment(UserProfileHolder.self) var userHolder

    @State var prayStartDate: Date = Date()
    @State var prayerList: String = ""
    @State var date: Date = Date()
    @State var saved: String = ""
    @FocusState private var isFocused: Bool
    
    let userService = UserService()
    let friendService = FriendService()
    let calendarService = CalendarService()
    
    var body: some View {
        NavigationStack {
            VStack{
                DatePicker(
                "Start Date",
                selection: $prayStartDate,
                displayedComponents: [.date]
                )
                .padding([.leading, .trailing], 85)
                .onTapGesture {
                    isFocused = true
                }
                
                Divider()
                Text("Add the friends you would like to pray for by submitting their names below. Adding a friend will create a profile for them within your account, unless you link to an active profile. To link to an active account, enter the person's name, followed by a semicolon, followed by the person's username.\n\nex. Berry Lam; berry")
                    .italic()
                    .padding(.all, 10)
                    .font(.system(size: 14))
                TextEditor(text: $prayerList)
                    .padding([.leading, .trailing], 20)
                    .padding([.top], 10)
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
                    .focused($isFocused)
                Spacer()
                Text(savedText())
                    .font(Font.system(size: 12))
                    .foregroundStyle(Color.red)
                Spacer()
            }
            .navigationTitle("Friend List")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                if self.isFocused == true {
                    ToolbarItem(placement: .topBarTrailing) {
                        Button(action: {
                            submitList()
                        }) {
                            Text("Save")
                                .offset(x: -4)
                                .font(.system(size: 14))
                                .padding([.leading, .trailing], 5)
                                .bold()
                        }
                        .background {
                            RoundedRectangle(cornerRadius: 15)
                                .fill(.blue)
                        }
                        .foregroundStyle(.white)
                    }
                }
            }
            .task {
                self.prayerList = userHolder.prayerList
                self.prayStartDate = userHolder.prayStartDate
            }
        }
    }
    
    //function to submit prayer list to firestore. This will update users' prayer list for retrieval into prayer calendar and it will also tie a friend to this user if the username is linked.
    func submitList() {
        Task {
            do {
                defer {
                    saved = "Saved"
                    self.isFocused = false // removes focus so keyboard disappears
                }
                
                try await submitPrayerList(inputText: prayerList, prayStartDate: prayStartDate, userHolder: userHolder, existingInput: userHolder.prayerList)
                
            } catch PrayerPersonRetrievalError.incorrectUsername {
                saved = "invalid username entered"
                print("invalid username entered")
            } catch {
                print("error: \(error.localizedDescription)")
            }
        }
    }
    
    func formatPostName(_ person: Person) -> String {
        return person.username.isEmpty ? "\(person.firstName)/\(person.lastName)" : person.username
    }
    
    func submitPrayerList(inputText: String, prayStartDate: Date, userHolder: UserProfileHolder, existingInput: String) async throws {
//            //Add user as friend to the friend's list.
        let prayerNamesOld = await calendarService.retrieveCalendarPersonArray(prayerList: existingInput).map {formatPostName($0)} // reference to initial state of prayer list
        
        let prayerNamesNew = await calendarService.retrieveCalendarPersonArray(prayerList: inputText).map {formatPostName($0)} // reference to new state of prayer list.
        
        var linkedFriends: [String] = []
            
        print("prayer list old: \(prayerNamesOld)")
        print("prayer list new: \(prayerNamesNew)")
        
        let insertions = Array(Set(prayerNamesNew).subtracting(Set(prayerNamesOld)))
        let removals = Array(Set(prayerNamesOld).subtracting(Set(prayerNamesNew)))
        
        print("insertions: ")
        print(insertions.description)
        print("removals: ")
        print(removals.description)
        
        // Removals MUST come prior to insertion. This is due to the edge case that you have a user that you are adding a username to. If so, you want to delete any request in the feed pertaining to the first name and last name (which was originally a private account you created), prior to inserting history for a username. If you allow insertions to come first, the deletion of 'first name_ last name' of that new public user will occur immediately after adding their posts to you feed. Ex. remove [Matt_Lam], insert [lammylol]. Not insert [lammylol], remove [Matt_lam] which will force all messages with 'matt lam' as first and last name to delete.
        
        for usernameOrName in removals {
            if usernameOrName.contains("/") == false { // This checks if the person is a linked account or not. If it was linked, usernameOrName would be a username. Usernames cannot have special characters in them.
                
                if await userService.checkIfUsernameExists(username: usernameOrName) == true {
                    do {
                        let person = try await userService.retrieveUserInfoFromUsername(person: Person(username: usernameOrName), userHolder: userHolder) // retrieve the "person" structure based on their username. Will return back user info.
                        
                        // Update the friends list of the person who you have now removed from your list. Their friends list is updated, so that when they post, it will not add to your feed. And, update your prayer feed to remove that person's prayer requests from your current feed.
                        try await friendService.deleteFriend(user: userHolder.person, friend: person)
                    } catch {
                        print(error)
                    }
                }
                
            } else { //else is for any names you have added which do not have a username; under your account and not linked.
                await friendService.removeFriendPostsFromUserFeed(userID: userHolder.person.userID, friendUsernameToRemove: usernameOrName)
            }
        }
        
        
        // for each person in prayerList who has a username (aka a linked account), check if the user already exists in the prayerList person's friendsList. If not, add their name and update all historical prayer feeds as well.
        for usernameOrName in insertions {
            if usernameOrName.contains("/") == false { // This checks if the person is a linked account or not. If it was linked, usernameOrName would be a username. Usernames cannot have special characters in them.
                
                var person = Person.blank
                    
                guard await userService.checkIfUsernameExists(username: usernameOrName) == true else {
                    throw PrayerPersonRetrievalError.incorrectUsername
                }
                
                person = try await userService.retrieveUserInfoFromUsername(person: Person(username: usernameOrName), userHolder: userHolder) // retrieve the "person" structure based on their username. Will return back user info.
                
                print("usernameOrName: \(usernameOrName)")
                    
                do {
                    // Update the friends list of the person who you have now added to your list. Their friends list is updated, so that when they post, it will add to your feed. At the same time, any of their existing requests will also populate into your feed.
                    try await friendService.addFriend(user: userHolder.person, friend: person)
                    try await friendService.updateFriendHistoricalPostsIntoFeed(user: userHolder.person, person: person)
                    
                } catch {
                    print(error.localizedDescription)
                }
                    
                linkedFriends.append(person.firstName + " " + person.lastName) // for printing purposes.
            } else { //else is for any names you have added which do not have a username; under your account and not linked.
                
                // Fetch all historical prayers from that person into your feed, noting that these do not have a linked username. So you need to pass in your own userID into that person for the function to retrieve out of your prayerFeed/youruserID.
                do {
                    try await friendService.updateFriendHistoricalPostsIntoFeed(user: userHolder.person, person: Person(userID: userHolder.person.userID, firstName: String(usernameOrName.split(separator: "/").first ?? ""), lastName: String(usernameOrName.split(separator: "/").last ?? "")))
                } catch {
                    throw PrayerPersonRetrievalError.errorRetrievingFromFirebase
                }
            }
        }
        
        print("Linked Friends: " + linkedFriends.description)
            
        self.prayStartDate = Calendar.current.startOfDay(for: prayStartDate)
        
        try await calendarService.updatePrayerCalendarList(userID: userHolder.person.userID, prayStartDate: prayStartDate, prayerList: prayerList)
        
            
        //reset local dataHolder
        userHolder.prayerList = prayerList/*.joined(separator: "\n")*/
        userHolder.prayerListArray = await calendarService.retrieveCalendarPersonArray(prayerList: prayerList)
        userHolder.prayStartDate = prayStartDate
    }
    
    //Function to changed "saved" text. When user saves textEditor, saved will appear until the user clicks back into textEditor, then the words "saved" should disappear. This will also occur when cancel is selected.
    func savedText() -> String {
        return saved
    }
}

//struct PrayerNameInputView_Previews: PreviewProvider {
//    static var previews: some View {
//        PrayerNameInputView(prayerListHolder: UserProfileHolder())
//            .environment(UserProfileHolder())
//            .environment(UserProfileHolder())
//    }
//}
