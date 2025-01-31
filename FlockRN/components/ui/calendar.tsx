import { Calendar } from 'react-native-calendars';

export function WeekCalendar() {
  // Get today's date in YYYY-MM-DD format
  const today = new Date();
  const currentDate = today.toISOString().split('T')[0];
  // Set up the week view by calculating the start and end of the current week
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - today.getDay()); // Set to the start of the week (Sunday)

  const endOfWeek = new Date(today);
  endOfWeek.setDate(today.getDate() + (6 - today.getDay())); // Set to the end of the week (Saturday)

  const startOfWeekStr = startOfWeek.toISOString().split('T')[0];
  const endOfWeekStr = endOfWeek.toISOString().split('T')[0];
  return (
    <Calendar
      current={currentDate} // Set current date to today
      minDate={startOfWeekStr} // Set the minimum date to the start of the current week
      maxDate={endOfWeekStr} // Set the maximum date to the end of the current week
      monthFormat={'yyyy MM'} // Format to show the month and year
      onDayPress={(day) => {
        console.log('Selected day', day);
      }}
      markedDates={{
        [currentDate]: {
          selected: true,
          selectedColor: 'blue',
          selectedTextColor: 'white',
          selectedDotColor: 'white',
          customStyles: {
            container: {
              backgroundColor: 'blue',
              borderRadius: 20,
            },
            text: {
              color: 'white',
              fontWeight: 'bold',
            },
          },
        },
      }}
    />
  );
}
