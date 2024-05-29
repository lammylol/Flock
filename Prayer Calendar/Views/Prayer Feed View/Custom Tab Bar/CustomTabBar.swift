//
//  CustomTabBar.swift
//  Prayer Calendar
//
//  Created by Matt Lam on 3/29/24.
//

import SwiftUI

struct CustomTabBarNew: View {
    
    @Binding var selectedTab: Int
    @State var pinned: [Post]
    @Environment(UserProfileHolder.self) var userHolder
    @Environment(FeedViewModel.self) var viewModel
    
    var body: some View {
        HStack(alignment: .center) {
            if userHolder.pinnedPrayerRequests.isEmpty == false {
                Button {
                    Task {
                        selectedTab = 0
//                        try await viewModel.statusFilter(option: .pinned, person: userHolder.person)
                    }
                } label: {
                    TabBarButton(type: "Pinned", isSelected: selectedTab == 0)
                }
            }
            
            Button {
                Task {
                    selectedTab = 1
//                    try await viewModel.statusFilter(option: .current, person: userHolder.person)
                }
            } label: {
                TabBarButton(type: "Current",  isSelected: selectedTab == 1)
                
            }
            
            Button {
                Task {
                    selectedTab = 2
//                    try await viewModel.statusFilter(option: .answered, person: userHolder.person)
                }
            } label: {
                TabBarButton(type: "Answered",  isSelected: selectedTab == 2)
            }
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 15)
        .padding(.horizontal, 15)
        //                    .withAnimation(.snappy) {
        //                        selectedTab = tab
        //                    }
    }
}
//
//#Preview {
//    CustomTabBarNew(pinned: PrayerRequests)
//}
