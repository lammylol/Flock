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
            Text(CalendarHelper().monthString(date: dataHolder.date) + " " + CalendarHelper().yearString(date: dataHolder.date))
                .font(.title2)
                .fontWeight(.bold)
                .multilineTextAlignment(.center)
                .padding(.horizontal)
                .frame(maxWidth: .infinity)
//            Spacer()
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
        dataHolder.date = CalendarHelper().minusMonth(date: dataHolder.date)
    }
    
    func nextMonth(){
        dataHolder.date = CalendarHelper().plusMonth(date: dataHolder.date)
    }
    
    struct DateScroller_Previews: PreviewProvider {
        static var previews: some View {
            DateScroller()
        }
    }
}

