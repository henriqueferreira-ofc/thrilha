
import { isSameDay } from "date-fns";
import { Task } from "@/types/task";

// Helper to add days to a date (moved from CalendarCustom)
export function addDays(date: Date, days: number) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

// Function to capitalize first letter
export function capitalizeFirst(str: string) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// Days of week abbreviations
export const weekDays = ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"];

// Checks if a task is scheduled for a specific date
export function isTaskOnDate(task: Task, date: Date): boolean {
  if (!task.due_date) return false;
  
  const taskDate = new Date(task.due_date);
  return taskDate.getFullYear() === date.getFullYear() &&
         taskDate.getMonth() === date.getMonth() &&
         taskDate.getDate() === date.getDate();
}

// Filter tasks for a specific date
export function filterTasksForDate(tasks: Task[], date: Date): Task[] {
  return tasks.filter(task => isTaskOnDate(task, date));
}

// Filter holidays for current month
export function filterHolidaysForMonth(holidays: {date: Date, name: string}[], currentMonth: Date) {
  return holidays.filter(holiday => 
    holiday.date.getMonth() === currentMonth.getMonth() && 
    holiday.date.getFullYear() === currentMonth.getFullYear()
  );
}

// Normalize dates (to avoid timezone issues)
export function normalizeDate(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

// Get unique dates from an array of tasks
export function getUniqueDates(tasks: Task[], statusFilter?: string): Date[] {
  // Filter tasks by status if specified
  const filteredTasks = statusFilter 
    ? tasks.filter(t => t.status === statusFilter && t.due_date)
    : tasks.filter(t => t.due_date);
  
  // Convert to date strings for deduplication
  const dateStrSet = new Set(
    filteredTasks.map(t => {
      const date = new Date(t.due_date!);
      return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
    })
  );
  
  // Convert strings back to Date objects
  return Array.from(dateStrSet).map(dateStr => {
    const [year, month, day] = dateStr.split('-').map(Number);
    return new Date(year, month, day);
  });
}

// Get unique holiday dates
export function getUniqueHolidayDates(holidays: {date: Date, name: string}[]): Date[] {
  const holidayDatesSet = new Set(
    holidays.map(h => {
      const date = h.date;
      return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
    })
  );
  
  return Array.from(holidayDatesSet).map(dateStr => {
    const [year, month, day] = dateStr.split('-').map(Number);
    return new Date(year, month, day);
  });
}

// Check if a date has a specific status
export function dateHasStatus(date: Date, datesToCheck: Date[]): boolean {
  return datesToCheck.some(d => isSameDay(d, date));
}
