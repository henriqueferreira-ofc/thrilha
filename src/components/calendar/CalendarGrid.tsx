
import { useState } from 'react';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Task } from '@/types/task';
import { ptBR } from 'date-fns/locale';

interface CalendarGridProps {
  selectedDate: Date | undefined;
  onSelectDate: (date: Date | undefined) => void;
  currentMonth: Date;
  onMonthChange: (month: Date) => void;
  tasks: Task[];
}

export const CalendarGrid = ({ 
  selectedDate, 
  onSelectDate,
  currentMonth,
  onMonthChange,
  tasks
}: CalendarGridProps) => {
  // Função para determinar que dias devem ser destacados no calendário (dias com tarefas)
  const getDaysWithTasks = tasks
    .filter((task) => task.due_date)
    .map((task) => new Date(task.due_date!));

  return (
    <CalendarComponent
      mode="single"
      selected={selectedDate}
      onSelect={onSelectDate}
      className="bg-[#1a1c23] rounded-lg"
      month={currentMonth}
      onMonthChange={onMonthChange}
      modifiers={{
        highlighted: getDaysWithTasks,
      }}
      modifiersClassNames={{
        highlighted: "relative after:absolute after:bottom-1 after:left-1/2 after:-translate-x-1/2 after:w-1 after:h-1 after:rounded-full after:bg-blue-500",
      }}
      locale={ptBR}
    />
  );
};
