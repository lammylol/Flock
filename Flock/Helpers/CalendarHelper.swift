//
//  CalendarHelper.swift
//  PrayerCalendar
//
//  Created by Matt Lam on 9/26/23.
//

import Foundation
import FirebaseFirestore

class CalendarHelper
{
    let calendar = Calendar.current
    
    func plusMonth(date: Date) -> Date
    {
        return calendar.date(byAdding: .month, value:1, to: date)!
    }
    
    func minusMonth(date: Date) -> Date
    {
        return calendar.date(byAdding: .month, value:-1, to: date)!
    }
    
    func addDay(date: Date, count: Int) -> Date
    {
        return calendar.date(byAdding: .day, value:count, to: date)!
    }
    
    func monthString(date: Date) -> String
    {
        let dateFormatter = DateFormatter()
        dateFormatter.dateFormat = "LLLL"
        return dateFormatter.string(from: date)
    }
    
    func yearString(date: Date) -> String
    {
        let dateFormatter = DateFormatter()
        dateFormatter.dateFormat = "yyyy"
        return dateFormatter.string(from: date)
    }
    
    func daysInMonth(date: Date) -> Int
    {
        let range = calendar.range(of: .day, in: .month, for: date)!
        return range.count
    }
    
    func dayOfMonth(date: Date) -> Int
    {
        let components = calendar.dateComponents([.day], from: date)
        return components.day!
    }
    
    func firstDayOfMonth(date: Date) -> Date
    {
        let components = calendar.dateComponents([.year, .month], from: date)
        return calendar.date(from: components)!
    }
    
    func weekDay(date: Date) -> Int
    {
        let components = calendar.dateComponents([.weekday], from: date)
        return components.weekday!
    }
    
    func rangeOfPrayerStart(startDate: Date, firstDayOfMonth: Date) -> Int
    {
        let range = calendar.dateComponents([.day], from: startDate, to: firstDayOfMonth)
        return range.day!
    }
    
    func addToDictionary(date: Date, index: String, name: String, dictionary: inout [Date: [String]])
    {
        dictionary[date] = [index, name]
    }
}
