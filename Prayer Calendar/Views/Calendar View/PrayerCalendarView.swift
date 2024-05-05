//
//  PrayerCalendarView.swift
//  PrayerCalendar
//
//  Created by Matt Lam on 9/25/23.
//

import SwiftUI
import SwiftData
import FirebaseFirestore
import FirebaseCore

struct PrayerCalendarView: View {
    @Environment(UserProfileHolder.self) var userHolder
    @Environment(PrayerListHolder.self) var prayerListHolder
    @Environment(DateHolder.self) var dateHolder
    @Environment(\.colorScheme) var colorScheme
    
    var body: some View {
        NavigationStack{        //Navigation Stack.
/*            ScrollView {  */      //ScrollView enables title to shrink.
//                HStack {
//                    Text("My Prayer Calendar")
//                        .font(.title2)
//                        .bold()
//                        .padding(.leading, 20)
//                        Spacer()
//                }
//                .offset(y: 10)
    //                .padding(.top, 27)
                
                LazyVStack(alignment: .leading, spacing: 0, pinnedViews: .sectionHeaders) { // LazyStack to freeze the top header when scrolling down.
                    Section {
                        VStack (spacing: 0) {
                            calendarGrid
                                .padding(.horizontal, 10)
                                .padding(.top, 20)
                        }
                        .background(Color.gray.opacity(0.05))
                    } header: { //Header that freezes for lazy stack.
                        VStack (spacing: 0) {
                            Text("")
                                .toolbar() {
                                    ToolbarItem(placement: .automatic) {
                                        NavigationLink(destination: PrayerNameInputView(prayerListHolder: prayerListHolder)){
                                            friendsListText
                                        }
                                        }
                                }
                            DateScroller()
                                .padding([.top, .bottom], 0)
                            Spacer()
                            dayOfWeekStack
                                .padding(.leading, 10)
                                .padding(.trailing, 10)
                                .padding([.top], 10)
                        }
                        .padding([.top, .bottom], 10)
                        .background(UIHelper().backgroundColor(colorScheme: colorScheme))
                        .navigationTitle("Prayer Calendar")
                        .navigationBarTitleDisplayMode(.automatic)
                        .navigationBarBackButtonHidden(true)
                        .toolbarBackground(UIHelper().backgroundColor(colorScheme: colorScheme), for: .navigationBar)
                    }
                }
//        }
        }
        .onAppear {
            dateHolder.date = Date() // Resets the view to current month 
        }
    }
    
    var dayOfWeekStack: some View {
        HStack(
            spacing: 1
        ){
            Text("S").dayOfWeek()
            Text("M").dayOfWeek()
            Text("T").dayOfWeek()
            Text("W").dayOfWeek()
            Text("T").dayOfWeek()
            Text("F").dayOfWeek()
            Text("S").dayOfWeek()
        }
        .font(Font.system(size: 12))
        .fontWeight(.semibold)
    }
    
    var calendarGrid: some View {
        VStack() {
//            prayerList = dataHolder.prayerList //Required so that view will reset when prayerList changes.
            let firstDayofMonth = CalendarHelper().firstDayOfMonth(date: dateHolder.date) //First Day of the Month
            let startingSpaces = CalendarHelper().weekDay(date: firstDayofMonth)-1 //Number of spaces before month starts in a table of 42 rows.
            let daysInMonth = CalendarHelper().daysInMonth(date: dateHolder.date) //Number of days in each month.
            let daysInPrevMonth = CalendarHelper().daysInMonth(date: CalendarHelper().minusMonth(date: dateHolder.date))
            
            let prayerStartingSpaces = CalendarHelper().weekDay(date: prayerListHolder.prayStartDate) //Number of spaces before prayer start date begins in a table of 42 rows.
            
            ForEach(0..<5){ row in
                HStack(spacing: 1)
                {
                    ForEach(1..<8)
                    { column in
                        let count = column + (row * 7)
                        let prayerRange =
                        CalendarHelper().rangeOfPrayerStart(startDate: prayerListHolder.prayStartDate, firstDayOfMonth: firstDayofMonth) + count - startingSpaces - 1
                        
                        CalendarCell(count: count, startingSpaces: startingSpaces, daysInMonth: daysInMonth, daysInPrevMonth: daysInPrevMonth, date: dateHolder.date, prayerStartingSpaces: prayerStartingSpaces, prayerList: prayerListHolder.prayerList, prayerRange: prayerRange)
                    }
                }
            }
        }
    }
    
    @ViewBuilder
    var friendsListText: some View {
        if prayerListHolder.prayerList.isEmpty {
            HStack {
                Text("Add a Friend to Pray For -> ")
                    .font(.system(size: 15))
                    .foregroundColor(.blue)
                Image(systemName: "list.bullet.circle")
            }
        } else {
            Image(systemName: "list.bullet.circle")
        }
    }
}

extension Text {
    func dayOfWeek() -> some View {
        self.frame(maxWidth: .infinity)
            .padding([.top], 1)
            .lineLimit(1)
    } // Sets dayOfWeek width and padding.
}

struct PrayerCalendarView_Previews: PreviewProvider {
    static var previews: some View {
        PrayerCalendarView()
            .environment(UserProfileHolder())
            .environment(PrayerListHolder())
    }
}
