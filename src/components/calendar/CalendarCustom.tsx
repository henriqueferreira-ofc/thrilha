
import { useState, useEffect } from 'react';
import {
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  isSameMonth,
  isSameDay,
  isEqual
} from "date-fns";
import { Task } from '@/types/task';
import { CalendarHeader } from './calendar-header';
import { CalendarWeek } from './calendar-week';
import { 
  addDays, 
  getUniqueDates, 
  getUniqueHolidayDates 
} from './calendar-utils';

export function CalendarCustom({
  value,
  onChange,
  tasks = [],
  primaryColor = "bg-purple-600",
  holidays = []
}: {
  value?: Date;
  onChange?: (date: Date) => void;
  tasks?: Task[];
  primaryColor?: string;
  holidays?: {date: Date; name: string}[];
}) {
  const [currentMonth, setCurrentMonth] = useState(value || new Date());
  const [pendingDate, setPendingDate] = useState<Date | null>(null);
  const today = new Date();

  // Sincronizar mês exibido com a data selecionada
  useEffect(() => {
    if (value) {
      setCurrentMonth(new Date(value.getFullYear(), value.getMonth(), 1));
    }
  }, [value]);

  // Selecionar data pendente após mudar o mês
  useEffect(() => {
    if (pendingDate) {
      onChange?.(pendingDate);
      setPendingDate(null);
    }
  }, [currentMonth, onChange, pendingDate]);

  // Process task dates with status
  const taskDates = getUniqueDates(tasks);
  const pendingDates = getUniqueDates(tasks, "todo");
  const doneDates = getUniqueDates(tasks, "done");
  
  // Process holiday dates
  const holidayDates = getUniqueHolidayDates(holidays);

  // Handle date click
  const handleDateClick = (clickedDate: Date) => {
    if (!isSameMonth(clickedDate, currentMonth)) {
      setCurrentMonth(new Date(clickedDate.getFullYear(), clickedDate.getMonth(), 1));
      setPendingDate(clickedDate);
    } else {
      onChange?.(clickedDate);
    }
  };

  // Handle month navigation
  const handlePrevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const handleNextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));

  // Generate calendar days
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const startDate = startOfWeek(monthStart, { weekStartsOn: 0 });
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 0 });

  // Create calendar grid
  const rows = [];
  let days = [];
  let day = startDate;

  while (day <= endDate) {
    for (let i = 0; i < 7; i++) {
      days.push(new Date(day));
      day = addDays(day, 1);
    }
    
    rows.push(days);
    days = [];
  }

  return (
    <div className="bg-black rounded-lg shadow-lg border border-white/5 p-4 w-full max-w-md mx-auto">
      <CalendarHeader 
        currentMonth={currentMonth}
        onPrevMonth={handlePrevMonth}
        onNextMonth={handleNextMonth}
        primaryColor={primaryColor}
      />
      
      <div className="flex flex-col gap-1">
        {rows.map((weekDays, weekIndex) => (
          <CalendarWeek
            key={weekIndex}
            days={weekDays}
            currentMonth={currentMonth}
            selectedDate={value}
            today={today}
            onDateClick={handleDateClick}
            primaryColor={primaryColor}
            pendingDates={pendingDates}
            doneDates={doneDates}
            holidayDates={holidayDates}
            tasks={tasks}
            holidays={holidays}
          />
        ))}
      </div>
    </div>
  );
}
