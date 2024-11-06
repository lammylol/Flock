//
//  FeedView.swift
//  Prayer Calendar
//
//  Created by Matt Lam on 1/2/24.
//

import SwiftUI
import FirebaseFirestore

struct FeedView: View {
    @State private var showSubmit: Bool = false
    @State private var showEdit: Bool = false
    @State private var selectedPage: Int = 1
    @State private var selectedTab: Int = 1
    @State private var tabProgress: CGFloat = 0
    @State private var height: CGFloat = 0
    @State private var sizeArray: [CGFloat] = [.zero, .zero, .zero]
    @State var prayerRequestVar: Post = Post.blank
    
    @Environment(UserProfileHolder.self) var userHolder
    @State var viewModel: FeedViewModel = FeedViewModel(viewType: .feed)
    @Environment(\.colorScheme) private var scheme
    @State private var navigationPath = NavigationPath()
    
    let headerText = "Flock \(buildConfiguration == DEVELOPMENT ? "DEV" : "")"
    var body: some View {
        NavigationStack(path: $navigationPath) {
            ScrollView(.vertical) {
                PostsFeed(viewModel: viewModel, person: userHolder.person, profileOrFeed: "feed", navigationPath: $navigationPath)
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
            .navigationDestination(for: Post.self) { post in
                PostFullView(
                    post: .constant(post), // Pass binding for post
                    navigationPath: $navigationPath
                )
            }
            .clipped()
        }
    }
}
//
//#Preview {
//    PrayerFeedView(person: Person(username: ""))
//}
