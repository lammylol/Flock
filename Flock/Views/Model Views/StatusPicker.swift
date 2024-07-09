//
//  StatusPicker.swift
//  Prayer Calendar
//
//  Created by Matt Lam on 6/2/24.
//

import SwiftUI

struct StatusPicker: View {
    @State var viewModel: FeedViewModel
    @Environment(UserProfileHolder.self) var userHolder
    @Environment(\.colorScheme) var colorScheme
    
    var body: some View {
        Menu {
            Button {
                viewModel.selectedStatus = .pinned
                userHolder.refresh = true
            } label: {
                Text("Pinned")
            }
            Button {
                viewModel.selectedStatus = .current
                userHolder.refresh = true
            } label: {
                Text("Current")
            }
            Button {
                viewModel.selectedStatus = .answered
                userHolder.refresh = true
            } label: {
                Text("Answered")
            }
            Button {
                viewModel.selectedStatus = .noLongerNeeded
                userHolder.refresh = true
            } label: {
                Text("No Longer Needed")
            }
        } label: {
            Image(systemName: "line.3.horizontal.decrease.circle.fill")
                .resizable()
                .frame(width: 20.0, height: 20.0)
                .foregroundStyle(colorScheme == .dark ? .white : .black)
        }
    }
}
//
//#Preview {
//    StatusPicker()
//}
