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
    
    @State var person: Person
    
    var body: some View {
        NavigationStack {
            ScrollView(.vertical) {
                PostsFeed(viewModel: viewModel, person: $person, profileOrFeed: "feed")
                    .onChange(of: viewModel.selectedStatus, {
                        Task {
                            if !viewModel.isFetching || !viewModel.isLoading {
                                await viewModel.getPrayerRequests(user: userHolder.person, person: person)
                            }
                        }
                    })
            }
            .refreshable {
                Task {
                    if viewModel.isFinished {
                        await viewModel.getPrayerRequests(user: userHolder.person, person: person)
                    }
                }
            }
            .sheet(isPresented: $showSubmit, onDismiss: {
                Task {
                    if viewModel.isFinished {
                        await viewModel.getPrayerRequests(user: userHolder.person, person: person)
                    }
                }
            }, content: {
                PostCreateView(person: person)
            })
            .toolbar() {
                ToolbarItem(placement: .topBarLeading) {
                    HStack {
                        Text("Flock")
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
