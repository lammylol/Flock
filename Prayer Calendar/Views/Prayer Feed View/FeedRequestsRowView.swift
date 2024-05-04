//
//  PrayerFeedRowView.swift
//  Prayer Calendar
//
//  Created by Matt Lam on 4/28/24.
//

import SwiftUI

struct FeedRequestsRowView: View {
    @State private var showEdit: Bool = false
//    @State var prayerRequests: [PrayerRequest] = []
    @State var prayerRequestVar: PrayerRequest = PrayerRequest.blank
    
    @State var viewModel: PrayerRequestViewModel
    @Environment(UserProfileHolder.self) var userHolder
    @Binding var height: CGFloat
    
    @State var person: Person
    @State var profileOrFeed: String = "feed"
    
    var body: some View {
        ZStack {
            if viewModel.isLoading || userHolder.refresh {
                if userHolder.refresh == true { // only if refreshable is activated, then task must run, but progress is hidden
                    Text("")
                        .task {
                            if userHolder.refresh == true {
                                do {
                                    self.person = try await PrayerPersonHelper().retrieveUserInfoFromUsername(person: person, userHolder: userHolder)
                                    await viewModel.getPrayerRequests(user: userHolder.person, person: person, profileOrFeed: profileOrFeed) // activate on refreshable
                                    userHolder.refresh = false
                                } catch {
                                    print(error.localizedDescription)
                                }
                            }
                        }
                } else {
                    ProgressView()
                }
            } else {
                LazyVStack {
                    ForEach(viewModel.prayerRequests) { prayerRequest in
                        VStack {
                            PrayerRequestRow(prayerRequest: prayerRequest, profileOrPrayerFeed: profileOrFeed)
                            Divider()
                        }
                        .task {
                            //   print("prayerRequest ID: "+prayerRequest.id)
                            //   print("viewModel.lastDocument: "+String(viewModel.lastDocument?.documentID ?? ""))
                            if viewModel.hasReachedEnd(of: prayerRequest) && !viewModel.isFetching {
                                await viewModel.getNextPrayerRequests(user: userHolder.person, person: person, profileOrFeed: profileOrFeed)
                            }
                        }
                    }
                }
            }
        }
        .scrollDismissesKeyboard(.immediately)
        .scrollContentBackground(.hidden)
        .task {
            if viewModel.prayerRequests.isEmpty {
                do {
                    viewModel.viewState = .loading
                    defer { viewModel.viewState = .finished }
                    
                    self.person = try await PrayerPersonHelper().retrieveUserInfoFromUsername(person: person, userHolder: userHolder)
                    await viewModel.getPrayerRequests(user: userHolder.person, person: person, profileOrFeed: profileOrFeed)
                } catch {
                    print(error.localizedDescription)
                }
            } else {
                self.viewModel.prayerRequests = viewModel.prayerRequests
                self.height = height
            }
        }
        .sheet(isPresented: $showEdit, onDismiss: {
            Task {
                do {
                    if viewModel.prayerRequests.isEmpty {
//                        self.person = try await PrayerPersonHelper().retrieveUserInfoFromUsername(person: person, userHolder: userHolder) // retrieve the userID from the username submitted only if username is not your own. Will return user's userID if there is a valid username. If not, will return user's own.
                        await viewModel.getPrayerRequests(user: userHolder.person, person: person, profileOrFeed: "profile")
                    } else {
                        self.viewModel.prayerRequests = viewModel.prayerRequests
                        self.height = height
                    }
                    print("Success retrieving prayer requests for \(person.userID)")
                }
            }
        }, content: {
            PrayerRequestFormView(person: userHolder.person, prayerRequest: $prayerRequestVar)
        })
        
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .top)
    }
}

//#Preview {
//    PrayerFeedRowView()
//}
