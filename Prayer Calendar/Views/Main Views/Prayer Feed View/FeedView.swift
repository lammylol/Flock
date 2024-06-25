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
    @State var viewModel: FeedViewModel = FeedViewModel(profileOrFeed: "feed")
    @Environment(\.colorScheme) private var scheme
    
    var person: Person
    
    var body: some View {
        NavigationStack {
            ScrollView(.vertical) {
                //             title hides when you scroll down
                HStack {
                    Text("Feed")
                        .font(.title3)
                        .bold()
                }
                .offset(y: 10)
                
                LazyVStack(alignment: .leading, pinnedViews: [.sectionHeaders]) {
                    // Pinned section
                    Section (
                        header:
                            HStack {
                                Text(viewModel.selectedStatus.statusKey.capitalized)
                                    .font(.title3)
                                StatusPicker(viewModel: viewModel)
                                    .onChange(of: viewModel.selectedStatus, {
                                        Task {
                                            if !viewModel.isFetching || !viewModel.isLoading {
                                                await viewModel.getPrayerRequests(user: userHolder.person, person: person)
                                            }
                                        }
                                    })
                                Spacer()
                            }
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 5)
                            .padding(.horizontal, 20)
                            .background(
                                scheme == .dark ? .black : .white
                            )
                    ){
                        PostsFeed(viewModel: viewModel, person: person, profileOrFeed: "feed")
                    }
                }
            }
            .refreshable {
                Task {
                    if viewModel.isFinished {
                        await viewModel.getPrayerRequests(user: userHolder.person, person: person)
                    }
                }
            }
            .clipped()
        }
    }
}

struct OffsetKey: PreferenceKey {
    static let defaultValue: CGFloat = .zero
    static func reduce(value: inout CGFloat, nextValue: () -> CGFloat) {
        value = nextValue()
    }
}

struct HeightKey: PreferenceKey {
    static let defaultValue: CGFloat = .zero
    static func reduce(value: inout CGFloat, nextValue: () -> CGFloat) {
        value = nextValue()
    }
}

extension View {
    @ViewBuilder
    func offsetX(completion: @escaping (CGFloat) -> ()) -> some View {
        self
            .overlay {
                GeometryReader {
                    let minX = $0.frame(in: .scrollView(axis: .horizontal)).minX
                    
                    Color.clear
                        .preference(key: OffsetKey.self, value: minX)
                        .onPreferenceChange(OffsetKey.self, perform: completion)
                }
            }
    }
    
    @ViewBuilder
    func getSizeOfView(completion: @escaping (CGFloat) -> ()) -> some View {
        self
            .background {
                GeometryReader { geo in
                    Color.clear
                        .preference(key: HeightKey.self, value: geo.size.height)
                        .onPreferenceChange(HeightKey.self, perform: completion)
                        .onAppear { print(geo.size.height) }
                }
            }
    }
    
    @ViewBuilder
    func tabMask(_ tabProgress: CGFloat, tabs: [Tab]) -> some View {
        
        ZStack {
            self
                .foregroundStyle(.gray)
            
            self
                .symbolVariant(.fill)
                .mask {
                    GeometryReader {
                        let size = $0.size
                        let capsuleWidth = size.width / CGFloat(tabs.count)
                        
                        Capsule()
                            .frame(width: capsuleWidth)
                            .offset(x: tabProgress * (size.width - capsuleWidth))
                    }
                }
        }
    }
}
//
//#Preview {
//    PrayerFeedView(person: Person(username: ""))
//}
