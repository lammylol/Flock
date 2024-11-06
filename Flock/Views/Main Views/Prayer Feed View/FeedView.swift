//
//  FeedView.swift
//  Prayer Calendar
//
//  Created by Matt Lam on 1/2/24.
//

import SwiftUI
import FirebaseFirestore

struct FeedView: View {
    @Environment(UserProfileHolder.self) var userHolder
    @Environment(NavigationManager.self) var navigationManager
    
    @State private var showSubmit: Bool = false
    @State private var showEdit: Bool = false
    @State private var selectedPage: Int = 1
    @State private var selectedTab: Int = 1
    @State private var tabProgress: CGFloat = 0
    @State private var height: CGFloat = 0
    @State private var sizeArray: [CGFloat] = [.zero, .zero, .zero]
    @State var prayerRequestVar: Post = Post.blank
    
    @State var viewModel: FeedViewModel = FeedViewModel(viewType: .feed)
    @Environment(\.colorScheme) private var scheme
    
    let headerText = "Flock \(buildConfiguration == DEVELOPMENT ? "DEV" : "")"
    var body: some View {
        ScrollView(.vertical) {
            PostsFeed(viewModel: viewModel, person: userHolder.person, profileOrFeed: "feed")
                .onChange(of: viewModel.selectedStatus, {
                    Task {
                        if !viewModel.isFetching || !viewModel.isLoading {
                            try await viewModel.getPosts(user: userHolder.person)
                        }
                    }
                })
                .padding(.horizontal, 23)
        }
        .refreshable {
            Task {
                if viewModel.isFinished {
                    try await viewModel.getPosts(user: userHolder.person)
                }
            }
        }
        .sheet(isPresented: $showSubmit, onDismiss: {
            Task {
                if viewModel.isFinished {
                    try await viewModel.getPosts(user: userHolder.person)
                }
            }
        }, content: {
            PostCreateView(person: userHolder.person)
        })
        .toolbar() {
            ToolbarItem(placement: .topBarLeading) {
                HStack {
                    Text(headerText)
                        .font(.title2)
                        .bold()
                    StatusPicker(viewModel: viewModel)
                        .padding(.trailing, -10)
                    Spacer()
                }
                .frame(maxWidth: .infinity)
                .padding(.leading, 10)
            }
            ToolbarItem(placement: .topBarTrailing) {
                Button(action: {
                    showSubmit.toggle()
                }) {
                    Image(systemName: "square.and.pencil")
                }
            }
        }
        .clipped()
    }
}
//
//#Preview {
//    PrayerFeedView(person: Person(username: ""))
//}
