//
//  PrayerRequestRows.swift
//  Prayer Calendar
//
//  Created by Matt Lam on 11/10/23.
//
// Description: This captures the layout of what each row in the prayer request list looks like.

import SwiftUI


struct PrayerRequestRow: View {
    @State var prayerRequest: PrayerRequest
    let profileOrPrayerFeed: String
    @Environment(UserProfileHolder.self) var userHolder
    
    var body: some View {
        NavigationLink(destination: PrayerRequestFormView(person: Person(userID: prayerRequest.userID, username: prayerRequest.username, firstName: prayerRequest.firstName, lastName: prayerRequest.lastName), prayerRequest: $prayerRequest)) {
            VStack{
                HStack {
                    if profileOrPrayerFeed == "feed" { //feed used in the feed view
                        VStack() {
                            NavigationLink(destination: ProfileView(person: Person(userID: prayerRequest.userID, username: prayerRequest.username, firstName: prayerRequest.firstName, lastName: prayerRequest.lastName))) {
                                ProfilePictureAvatar(firstName: prayerRequest.firstName, lastName: prayerRequest.lastName, imageSize: 50, fontSize: 20)
                                    .buttonStyle(.plain)
                                    .foregroundStyle(Color.primary)
                            }
                            Spacer()
                        }
                        .padding(.trailing, 10)
                    } else { //used in 'profile' view
                        VStack() {
                            ProfilePictureAvatar(firstName: prayerRequest.firstName, lastName: prayerRequest.lastName, imageSize: 50, fontSize: 20)
                                .buttonStyle(.plain)
                                .foregroundStyle(Color.primary)
                            Spacer()
                        }
                        .padding(.trailing, 10)
                    }
                    
                    VStack(alignment: .leading) {
                        HStack() {
                            Text(prayerRequest.firstName + " " + prayerRequest.lastName).font(.system(size: 16)).bold()
                            Spacer()
                            if prayerRequest.isPinned == true {
                                Image(systemName: "pin.fill")
                            }
                            Menu {
                                Button {
                                    self.pinPrayerRequest()
                                } label: {
                                    if prayerRequest.isPinned == false {
                                        Label("Pin to feed", systemImage: "pin.fill")
                                    } else {
                                        Label("Unpin prayer request", systemImage: "pin.slash")
                                    }
                                }
                                //            Button {pinPrayerRequest()
                                //            } label: {
                                //                Label("Remove from feed", systemImage: "pin.fill")
                                //            }
                            } label: {
                                Label("", systemImage: "ellipsis")
                            }
                            .highPriorityGesture(TapGesture())
                            //                        .onDisappear(perform: {
                            //
                            //                        })
                            //                        PrayerRequestMenu(prayerRequest: $prayerRequest)
                            //                            .highPriorityGesture(TapGesture())
                        }
                        .font(.system(size: 12))
                        .padding(.bottom, 2)
                        HStack() {
                            Text("Prayer Status: ").font(.system(size: 12)).italic() + Text(prayerRequest.status.capitalized)
                                .font(.system(size: 12))
                                .italic()
                            Spacer()
                        }
                        
                        if prayerRequest.prayerRequestTitle != "" {
                            Text(prayerRequest.prayerRequestTitle)
                                .font(.system(size: 18))
                                .bold()
                                .multilineTextAlignment(.leading)
                                .padding(.top, 7)
                        }
                        
                        if prayerRequest.latestUpdateText != "" {
                            VStack (alignment: .leading) {
                                Text("**\(prayerRequest.latestUpdateType)**: \(prayerRequest.latestUpdateDatePosted.formatted(date: .abbreviated, time: .omitted)), \(prayerRequest.latestUpdateText)")
                                    .multilineTextAlignment(.leading)
                                    .font(.system(size: 16))
                                    .italic()
                                    .padding(.bottom, 0)
                                Text("\(prayerRequest.prayerRequestText)")
                                    .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .leading)
                                    .lineLimit(15)
                                    .fixedSize(horizontal: false, vertical: true)
                                    .font(.system(size: 16))
                                    .multilineTextAlignment(/*@START_MENU_TOKEN@*/.leading/*@END_MENU_TOKEN@*/)
                            }
                            .padding(.top, 7)
                        } else {
                            VStack {
                                Text(prayerRequest.prayerRequestText)
                                    .font(.system(size: 16))
                                    .frame(maxWidth: .infinity, alignment: .leading)
                                    .multilineTextAlignment(/*@START_MENU_TOKEN@*/.leading/*@END_MENU_TOKEN@*/)
                                    .padding(.top, 7)
                            }
                        }
                        Text(prayerRequest.date, style: .date)
                            .font(.system(size: 12))
                            .padding(.top, 7)
                    }
                    .foregroundStyle(Color.primary)
                }
                .padding([.leading, .trailing], 20)
                .padding([.top, .bottom], 15)
                .frame(maxWidth: .infinity, maxHeight: .infinity)
            }
        }
    }
    
    func pinPrayerRequest(){
        var isPinnedToggle = prayerRequest.isPinned
        isPinnedToggle.toggle()
        prayerRequest.isPinned = isPinnedToggle
        
        if isPinnedToggle == true {
            userHolder.pinnedPrayerRequests.append(prayerRequest)
        } else {
            userHolder.pinnedPrayerRequests.removeAll(where: { $0.id == prayerRequest.id})
        }
        
        PrayerRequestHelper().togglePinned(person: userHolder.person, prayerRequest: prayerRequest, toggle: isPinnedToggle)
        userHolder.refresh = true
    }
    
    func removeFromFeed(){
        //removeFeed
    }
}

struct LatestUpdate: View {
    var prayerRequest: PrayerRequest
    
    var body: some View {
        VStack(alignment: .leading) {
            Text("\(prayerRequest.latestUpdateType): \(prayerRequest.latestUpdateText)")
                .multilineTextAlignment(.leading)
                .frame(maxWidth: .infinity, alignment: .leading)
                .font(.system(size: 14))
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }
}

//Viz for menu pop-up for prayer request functions.
//struct PrayerRequestMenu: View {
//    @Environment(UserProfileHolder.self) var userHolder
//    @State var prayerRequest: PrayerRequest
////    @State var isPinnedToggle: Bool
//    
//    var body: some View {
//        Menu {
//            Button {self.pinPrayerRequest()
//            } label: {
//                if prayerRequest.isPinned == false {
//                    Label("Pin to feed", systemImage: "pin.fill")
//                } else {
//                    Label("Unpin prayer request", systemImage: "pin.slash")
//                }
//            }
////            Button {pinPrayerRequest()
////            } label: {
////                Label("Remove from feed", systemImage: "pin.fill")
////            }
//        } label: {
//            Label("", systemImage: "ellipsis")
//        }
//    }
//    
//    //pin to feed function. Only to user's feed.
//    func pinPrayerRequest(){
//        var isPinnedToggle = prayerRequest.isPinned
//        if isPinnedToggle == false {
//            userHolder.pinnedPrayerRequests.append(prayerRequest)
//        } else {
//            userHolder.pinnedPrayerRequests.removeAll(where: { $0.id == prayerRequest.id})
//        }
//        PrayerRequestHelper().togglePinned(person: userHolder.person, prayerRequest: prayerRequest)
//        isPinnedToggle.toggle()
//        prayerRequest.isPinned = isPinnedToggle
//    }
//    
//    func removeFromFeed(){
//        //removeFeed
//    }
//}

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

//#Preview {
//    PrayerRequestRow(prayerRequest: PrayerRequest(userID: "", username: "lammylol", date: Date(), prayerRequestText: "Prayers for this text to look beautiful. Prayers for this text to look beautiful.", status: "Current", firstName: "Matt", lastName: "Lam", priority: "high", isPinned: true, prayerRequestTitle: "Prayers for Text", latestUpdateText: "Test Latest update: Prayers for this text to look beautiful. Prayers for this text to look beautiful.", latestUpdateDatePosted: Date(), latestUpdateType: "Testimony"), profileOrPrayerFeed: "feed").frame(maxHeight: 200)
//}
//
//#Preview {
//    LatestUpdate(prayerRequest: PrayerRequest(userID: "", username: "lammylol", date: Date(), prayerRequestText: "Prayers for this text to look beautiful. Prayers for this text to look beautiful.", status: "Current", firstName: "Matt", lastName: "Lam", priority: "high", isPinned: true, prayerRequestTitle: "Prayers for Text", latestUpdateText: "Test Latest update: Prayers for this text to look beautiful. Prayers for this text to look beautiful.", latestUpdateDatePosted: Date(), latestUpdateType: "Testimony"))
//}
