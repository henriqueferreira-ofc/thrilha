
import { CalendarDay } from "./calendar-day";
import { Task } from "@/types/task";

interface CalendarWeekProps {
  days: Date[];
  currentMonth: Date;
  selectedDate?: Date;
  today: Date;
  onDateClick: (date: Date) => void;
  primaryColor: string;
  pendingDates: Date[];
  doneDates: Date[];
  holidayDates: Date[];
  tasks: Task[];
  holidays: {date: Date, name: string}[];
}

export function CalendarWeek({
  days,
  currentMonth,
  selectedDate,
  today,
  onDateClick,
  primaryColor,
  pendingDates,
  doneDates,
  holidayDates,
  tasks,
  holidays
}: CalendarWeekProps) {
  return (
    <div className="grid grid-cols-7 gap-1">
      {days.map((day, index) => (
        <CalendarDay
          key={`${day.toString()}-${index}`}
          day={day}
          currentMonth={currentMonth}
          selectedDate={selectedDate}
          isToday={day.getDate() === today.getDate() &&
                  day.getMonth() === today.getMonth() &&
                  day.getFullYear() === today.getFullYear()}
          onDateClick={onDateClick}
          primaryColor={primaryColor}
          pendingDates={pendingDates}
          doneDates={doneDates}
          holidayDates={holidayDates}
          tasks={tasks}
          holidays={holidays}
        />
      ))}
    </div>
  );
}
