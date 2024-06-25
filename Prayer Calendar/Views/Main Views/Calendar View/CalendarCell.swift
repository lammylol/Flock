//
//  CalendarCell.swift
//  PrayerCalendar
//
//  Created by Matt Lam on 9/26/23.
//

import Foundation
import SwiftUI

struct CalendarCell: View {
    @Environment(\.colorScheme) var colorScheme
    @Environment(UserProfileHolder.self) var userHolder
    
    let count: Int
    let startingSpaces: Int
    let daysInMonth: Int
    let daysInPrevMonth: Int
    let date: Date
    
    let prayerStartingSpaces: Int
    let prayerList: String
    let prayerListArray: [Person]
    let prayerRange: Int
    
    var prayerName: String = ""
    
    init(count: Int, startingSpaces: Int, daysInMonth: Int, daysInPrevMonth: Int, date: Date, prayerStartingSpaces: Int, prayerList: String, prayerRange: Int) {
        self.count = count
        self.startingSpaces = startingSpaces
        self.daysInMonth = daysInMonth
        self.daysInPrevMonth = daysInPrevMonth
        self.date = date
        self.prayerStartingSpaces = prayerStartingSpaces
        self.prayerList = prayerList
        self.prayerRange = prayerRange
        self.prayerListArray = PersonHelper().retrievePrayerPersonArray(prayerList: prayerList)
    }
        
    var body : some View {
        if monthStruct().person.firstName == "" {
            VStack {
                Text(monthStruct().day())
                    .font(.title3)
                    .fontWeight(.semibold)
                    .foregroundColor(textColor(type: monthStruct().monthType))
                Spacer()
                Text(monthStruct().person.firstName)
                    .font(Font.system(size: 12))
                    .foregroundColor(textColor(type: monthStruct().monthType))
                Spacer()
            }
            .frame(maxWidth: .infinity)
            .frame(height: 95)
        } else {
            NavigationLink(destination: ProfileView(person: Person(username: monthStruct().person.username, firstName: monthStruct().person.firstName, lastName: monthStruct().person.lastName))) {
                
                if (monthStruct().day() == Date.now.formatted(.dateTime.day()) &&
                    date.formatted(date: .abbreviated, time: .omitted) == Date().formatted(date: .abbreviated, time: .omitted) && monthStruct().monthType == MonthType.Current) {
                        VStack {
                            Text(monthStruct().day())
                                .font(.title3)
                                .fontWeight(.semibold)
                                .foregroundColor(.white)
                                .background(
                                    Circle()
                                        .foregroundStyle(.blue)
                                        .padding(.all, -10)
                                        .frame(maxWidth: .infinity, maxHeight: .infinity)
                                )
                            Spacer()
                            Text(monthStruct().person.firstName)
                                .font(Font.system(size: 12))
                                .foregroundColor(textColor(type: monthStruct().monthType))
                            Spacer()
                        }
                        .frame(maxWidth: .infinity)
                        .frame(height: 95)
                } else {
                    VStack {
                        Text(monthStruct().day())
                            .font(.title3)
                            .fontWeight(.semibold)
                            .foregroundColor(textColor(type: monthStruct().monthType))
                        Spacer()
                        Text(monthStruct().person.firstName)
                            .font(Font.system(size: 12))
                            .foregroundColor(textColor(type: monthStruct().monthType))
                        Spacer()
                    }
                    .frame(maxWidth: .infinity)
                    .frame(height: 95)
                }
            }
        }
    }
    
    func textColor(type: MonthType) -> Color {
        if type == MonthType.Current {
            if colorScheme == .light {
                return Color.black
            } else {
                return Color.white
            }
        } else {
            return Color.gray
        }
    }
    
    func monthStruct() -> MonthStruct {
        let start = startingSpaces // == 0 ? startingSpaces + 7: startingSpaces
        //        let prayerStart = prayerStartingSpaces == 0 ? prayerStartingSpaces + 7: prayerStartingSpaces
        
        if (count <= start) {
            let day = daysInPrevMonth - (startingSpaces - count)
            let person = prayerNameFunc(count: count, prayerRange: prayerRange, prayerListArray: prayerListArray)
            return MonthStruct(monthType: MonthType.Previous, dayInt: day, prayerRange: prayerRange, person: person ?? Person.blank)
        }
        
        else if ((count - startingSpaces) > daysInMonth) {
            let day = count - startingSpaces - daysInMonth
            let person = prayerNameFunc(count: count, prayerRange: prayerRange, prayerListArray: prayerListArray)
            return MonthStruct(monthType: MonthType.Next, dayInt: day, prayerRange: prayerRange, person: person ?? Person.blank)
        }
        
        let day = count-start
        let person = prayerNameFunc(count: count, prayerRange: prayerRange, prayerListArray: prayerListArray)
        return MonthStruct(monthType: MonthType.Current, dayInt: day, /*prayerName: person?.name ?? "",*/ prayerRange: prayerRange, /*prayerUsername: person?.username ?? "", */person: person ?? Person.blank)
    }
    
    func prayerNameFunc(count: Int, prayerRange: Int, prayerListArray: [Person]) -> Person? {
        if prayerRange < 0 || prayerListArray.isEmpty { //(count - startingSpaces)
            return nil
        }
        return prayerListArray[prayerRange % prayerListArray.count]
    }

}
//
//struct CalendarCell_Previews: PreviewProvider {
//    static var previews: some View {
//        CalendarCell(count: 1, startingSpaces: 1, daysInMonth: 1, daysInPrevMonth: 1, date: Date(), prayerStartingSpaces: 1, prayerList: "Matt", prayerRange: 1)
//    }
//}
