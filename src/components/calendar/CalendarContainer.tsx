
import { useState } from 'react';
import { isSameDay } from 'date-fns';
import { Task } from '@/types/task';
import { CalendarNavigation } from './CalendarNavigation';
import { CalendarGrid } from './CalendarGrid';
import { CalendarHeader } from './CalendarHeader';
import { TaskList } from './TaskList';
import { useIsMobile } from '@/hooks/use-mobile';

interface CalendarContainerProps {
  tasks: Task[];
  loading: boolean;
  onStatusChange: (taskId: string, newStatus: Task['status']) => Promise<void>;
  onDeleteTask: (taskId: string) => Promise<void>;
}

export const CalendarContainer = ({
  tasks,
  loading,
  onStatusChange,
  onDeleteTask
}: CalendarContainerProps) => {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const isMobile = useIsMobile();

  // Filtrar tarefas pela data selecionada
  const tasksForSelectedDate = tasks.filter((task) => {
    if (!selectedDate || !task.due_date) return false;
    
    const taskDate = new Date(task.due_date);
    return isSameDay(taskDate, selectedDate);
  });

  // Função para navegação manual entre meses
  const navigateMonth = (direction: 'prev' | 'next') => {
    const newMonth = new Date(currentMonth);
    if (direction === 'prev') {
      newMonth.setMonth(newMonth.getMonth() - 1);
    } else {
      newMonth.setMonth(newMonth.getMonth() + 1);
    }
    setCurrentMonth(newMonth);
  };

  return (
    <div className={`grid grid-cols-1 ${isMobile ? '' : 'lg:grid-cols-2'} gap-6`}>
      <div className="bg-black p-4 rounded-lg border border-white/10">
        <CalendarNavigation 
          currentMonth={currentMonth} 
          onNavigate={navigateMonth} 
        />
        <CalendarGrid
          selectedDate={selectedDate}
          onSelectDate={setSelectedDate}
          currentMonth={currentMonth}
          onMonthChange={setCurrentMonth}
          tasks={tasks}
        />
      </div>

      <div className="bg-black p-4 rounded-lg border border-white/10">
        <CalendarHeader selectedDate={selectedDate} />
        <div className="mt-4">
          {loading ? (
            <div className="text-center py-6 text-muted-foreground">
              Carregando tarefas...
            </div>
          ) : (
            <TaskList 
              tasks={tasksForSelectedDate} 
              onStatusChange={onStatusChange}
              onDeleteTask={onDeleteTask}
              selectedDate={selectedDate}
            />
          )}
        </div>
      </div>
    </div>
  );
};
