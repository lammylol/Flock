//
//  PrayerFeedRowView.swift
//  Prayer Calendar
//
//  Created by Matt Lam on 4/28/24.
//

import SwiftUI

struct PostsFeed: View {
    
    @State var viewModel: FeedViewModel
    @Environment(UserProfileHolder.self) var userHolder
    @Binding var person: Person
    @State var profileOrFeed: String = "feed"
    @State private var showSubmit: Bool = false
    
    var userService = UserService()
    
    var body: some View {
        ZStack {
            if viewModel.isLoading/* && !userHolder.refresh*/ {
                ProgressView()
            } else {
                LazyVStack {
                    ForEach($viewModel.prayerRequests) { $prayerRequest in
                        VStack {
                            PostRow(viewModel: viewModel, post: $prayerRequest)
                            Rectangle()
                                .frame(height: 4)
                                .foregroundStyle(.bar)
                        }
                        .task {
                            if viewModel.hasReachedEnd(of: prayerRequest) && !viewModel.isFetching {
                                await viewModel.getNextPrayerRequests(user: userHolder.person, person: person, profileOrFeed: profileOrFeed)
                            }
                        }
                    }
                }
                .scrollContentBackground(.hidden)
            }
        }
        .task {
            if viewModel.prayerRequests.isEmpty {
                if !viewModel.isFetching || !viewModel.isLoading {
                    if person.friendState == "sent" || person.friendState == "pending" {
                        return
                    }
                    await viewModel.getPrayerRequests(user: userHolder.person, person: person)
                    self.viewModel.prayerRequests = viewModel.prayerRequests
                }
            }
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .top)
        .overlay {
            if person.friendState == "pending" || person.friendState == "sent" { // overlay if profile has not been friended yet.
                VStack{
                    ContentUnavailableView {
                        Label("Not Friends Yet", systemImage: "lock.square")
                    } description: {
                        Text("You must be friends with this account before you can see their posts.")
                    }
                    .frame(height: 200)
                    .offset(y: 140)
                    Spacer()
                }
            } else if viewModel.prayerRequests.isEmpty && viewModel.isFinished { // overlay for 'no posts available'
                VStack{
                    ContentUnavailableView {
                        Label("No Posts Available...Yet!", systemImage: "list.bullet.rectangle.portrait")
                    } description: {
                        if profileOrFeed == "feed" {
                            if viewModel.selectedStatus == .pinned {
                                Text("You will need to pin an exisiting post to see posts here")
                            } else if viewModel.selectedStatus == .answered {
                                Text("No posts have been 'answered' yet. They will be featured here once you change the status to answered.")
                            } else if viewModel.selectedStatus == .noLongerNeeded {
                                Text("No posts have been marked as 'no longer needed.'")
                            } else {
                                Text("Link friends to your calendar to start seeing prayer requests. Or, you can add prayers to your profile or to a private account and they'll also be featured here.")
                            }
                        } else {
                            if viewModel.selectedStatus == .pinned {
                                Text("You will need to pin an exisiting post to see posts here")
                            } else if viewModel.selectedStatus == .answered {
                                // Only show this if this account is saved under your userID.
                                if person.username == "" || person.userID == userHolder.person.userID {
                                    Text("None of your posts have been 'answered' yet, but that's okay! They will be featured here once you change the status to answered.")
                                } else {
                                    Text("\(person.firstName) has no answered posts yet.")
                                }
                            } else if viewModel.selectedStatus == .answered {
                                Text("") // Empty. Just shows the main description.
                            } else {
                                if person.username == "" || person.userID == userHolder.person.userID {
                                    Text("Start adding posts to the list")
                                } else {
                                    Text("\(person.firstName) has no posts to share.")
                                }
                            }
                        }
                    } actions: {
                        if profileOrFeed == "feed" {
                            if viewModel.selectedStatus == .current {
                                Button(action: {showSubmit.toggle() })
                                {
                                    Text("Add a Post")
                                        .font(.system(size: 16))
                                }
                            }
                        } else {
                            if viewModel.selectedStatus == .current {
                                if person.username == "" || person.userID == userHolder.person.userID {
                                    Button(action: {showSubmit.toggle() })
                                    {
                                        Text("Add a Post")
                                            .font(.system(size: 16))
                                    }
                                }
                            }
                        }
                    }
                    .frame(height: 500)
                    .offset(y: 140)
                    Spacer()
                }
        }
        }
        .sheet(isPresented: $showSubmit, onDismiss: {
            Task {
                do {
                    self.person = try await userService.retrieveUserInfoFromUsername(person: person, userHolder: userHolder)
                    
                    if !viewModel.isFetching || !viewModel.isLoading {
                        await viewModel.getPrayerRequests(user: userHolder.person, person: person)
                        self.viewModel.prayerRequests = viewModel.prayerRequests
                    }
                } catch {
                    print(error.localizedDescription)
                }
            }
        }, content: {
            SubmitPostForm(person: person)
        })
    }
}

//#Preview {
//    PrayerFeedRowView()
//}
