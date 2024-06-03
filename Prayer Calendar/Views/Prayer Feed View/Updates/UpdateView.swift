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
    @State var person: Person
    @State private var expandUpdate: Bool = false
    
    var body: some View {
        NavigationStack {
            ScrollView {
                VStack {
                    if prayerRequestUpdates.count > 0 {
                        ForEach(prayerRequestUpdates) { update in
                            VStack (alignment: .leading) {
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
                                    .multilineTextAlignment(.leading)
                                    .lineLimit({
                                        if expandUpdate == false {
                                            10
                                        } else {
                                            .max
                                        }
                                    }())
                            }
                            .padding(.all, 20)
                            .animation(.default, value: expandUpdate)
                            .background(
                                RoundedRectangle(cornerRadius: 10)
                                    .fill(.gray)
                                    .opacity(0.06)
                            )
                            .foregroundStyle(Color.primary)
                            .padding(.bottom, 7)
                            .onTapGesture(perform: {
                                self.expandLines()
                            })
                        }
                    }
                }
            }
            .scrollIndicators(.hidden)
        }
        .task {
            do {
                prayerRequestUpdates = try await PrayerUpdateHelper().getPrayerRequestUpdates(prayerRequest: post, person: person)
            } catch {
                print("error retrieving")
            }
        }
        .padding([.leading, .trailing], 20)
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .navigationTitle("Updates")
        .navigationBarTitleDisplayMode(.inline)
    }
    
    func expandLines() {
        expandUpdate.toggle()
    }
}

//#Preview {
//    UpdateView(prayerRequestUpdates: PostUpdate.postUpdates,
//               post: Post.preview, person: Person.blank)
//}
