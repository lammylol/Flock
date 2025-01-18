//
//  CalendarHelper.swift
//  PrayerCalendar
//
//  Created by Matt Lam on 9/26/23.
//

//
//  CalendarHelper.swift
//  PrayerCalendar
//
//  Created by Matt Lam on 9/26/23.
//

import Foundation

class CalendarHelper {

    private let calendar = Calendar.current
    private let dateFormatter = DateFormatter()
    
    func plusMonth(to date: Date) -> Date {
        guard let newDate = calendar.date(byAdding: .month, value: 1, to: date) else {
            fatalError("Could not add month to date")
        }
        return newDate
    }
    
    func minusMonth(from date: Date) -> Date {
        guard let newDate = calendar.date(byAdding: .month, value: -1, to: date) else {
            fatalError("Could not subtract month from date")
        }
        return newDate
    }
    
    func addDays(to date: Date, count: Int) -> Date {
        guard let newDate = calendar.date(byAdding: .day, value: count, to: date) else {
            fatalError("Could not add days to date")
        }
        return newDate
    }
    
    func monthString(from date: Date) -> String {
        dateFormatter.dateFormat = "LLLL"
        return dateFormatter.string(from: date)
    }
    
    func yearString(from date: Date) -> String {
        dateFormatter.dateFormat = "yyyy"
        return dateFormatter.string(from: date)
    }
    
    func daysInMonth(for date: Date) -> Int {
        guard let range = calendar.range(of: .day, in: .month, for: date) else {
            fatalError("Could not get days in month")
        }
        return range.count
    }
    
    func dayOfMonth(for date: Date) -> Int {
        guard let day = calendar.dateComponents([.day], from: date).day else {
            fatalError("Could not get day of month")
        }
        return day
    }
    
    func firstDayOfMonth(for date: Date) -> Date {
        guard let firstDay = calendar.date(from: calendar.dateComponents([.year, .month], from: date)) else {
            fatalError("Could not get first day of month")
        }
        return firstDay
    }
    
    func weekDay(for date: Date) -> Int {
        guard let weekday = calendar.dateComponents([.weekday], from: date).weekday else {
            fatalError("Could not get weekday")
        }
        return weekday
    }
    
    func rangeOfPrayerStart(from startDate: Date, to firstDayOfMonth: Date) -> Int {
        guard let range = calendar.dateComponents([.day], from: startDate, to: firstDayOfMonth).day else {
            fatalError("Could not get range of prayer start")
        }
        return range
    }
    
    func addToDictionary(date: Date, index: String, name: String, dictionary: inout [Date: [String]]) {
        dictionary[date] = [index, name]
    }
}
