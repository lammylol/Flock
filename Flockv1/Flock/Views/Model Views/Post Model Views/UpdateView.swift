//
//  UpdateView.swift
//  Prayer Calendar
//
//  Created by Matt Lam on 5/29/24.
//

import SwiftUI

struct UpdateView: View {
    @State var prayerRequestUpdates: [PostUpdate] = []
    @State var post: Post
    
    var body: some View {
        ScrollView {
            VStack {
                if prayerRequestUpdates.count > 0 {
                    ForEach(prayerRequestUpdates) { update in
                        UpdateRow(update: update)
                    }
                }
            }
        }
        .scrollIndicators(.hidden)
        .clipped()
        .task {
            do {
                prayerRequestUpdates = try await PostUpdateHelper().getPrayerRequestUpdates(prayerRequest: post, person: post.person)
            } catch {
                ViewLogger.error("UpdateView error retrieving")
            }
        }
        .padding([.leading, .trailing], 20)
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .navigationTitle("Updates")
        .navigationBarTitleDisplayMode(.inline)
    }
}

struct UpdateRow: View {
    let update: PostUpdate
    @State private var expandUpdate: Bool = false
    
    var body: some View {
        VStack(alignment: .leading) {
            HStack {
                Text(update.datePosted, style: .date)
                    .font(.system(size: 16))
                    .padding(.top, 5)
                Spacer()
                Text(update.updateType)
                    .padding(.bottom, 5)
                    .font(.system(size: 16))
            }
            .padding(.bottom, 5)
            .bold()
            
            Rectangle()
                .frame(height: 0.2)
                .foregroundStyle(Color.primary)
                .padding(.bottom, 5)
            
            Text(update.prayerUpdateText)
                .font(.system(size: 16))
                .multilineTextAlignment(.leading)
                .lineLimit(expandUpdate ? nil : 10)  // Show full text if expanded
        }
        .padding(20)
        .animation(.default, value: expandUpdate)
        .background(
            RoundedRectangle(cornerRadius: 10)
                .fill(Color(UIColor.systemGray6))
        )
        .foregroundStyle(Color.primary)
        .padding(.bottom, 7)
        .onTapGesture {
            expandUpdate.toggle()
        }
    }
}

//#Preview {
//    UpdateView(prayerRequestUpdates: PostUpdate.postUpdates,
//               post: Post.preview, person: Person.blank)
//}
