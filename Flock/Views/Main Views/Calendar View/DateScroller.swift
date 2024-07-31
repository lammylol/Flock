//
//  DateScroller.swift
//  PrayerCalendarSwift
//
//  Created by Matt Lam on 9/26/23.
//

import SwiftUI
import Observation

struct DateScroller: View {
    
    @Environment(DateHolder.self) var dataHolder
    
    var body: some View {
        @Bindable var dataHolder = dataHolder
        HStack(alignment: .center) {
            Spacer()
            Button(action: {previousMonth()}){
                Image(systemName: "arrow.left.circle.fill")
                    .imageScale(.small)
                    .font(Font.title)
                    .padding(.leading, 33)
            }
            Text(CalendarHelper().monthString(from: dataHolder.date) + " " + CalendarHelper().yearString(from: dataHolder.date))
                .font(.title2)
                .fontWeight(.bold)
                .multilineTextAlignment(.center)
                .padding(.horizontal)
                .frame(maxWidth: .infinity)
            Button(action: {nextMonth()}){
                Image(systemName: "arrow.right.circle.fill")
                    .imageScale(.small)
                    .font(Font.title)
                    .padding(.trailing, 33)
            }
            Spacer()
        }
        .padding(/*@START_MENU_TOKEN@*/.horizontal/*@END_MENU_TOKEN@*/)
        
    }
    
    func previousMonth(){
        dataHolder.date = CalendarHelper().minusMonth(from: dataHolder.date)
    }
    
    func nextMonth(){
        dataHolder.date = CalendarHelper().plusMonth(to: dataHolder.date)
    }
    
    struct DateScroller_Previews: PreviewProvider {
        static var previews: some View {
            DateScroller()
        }
    }
}

