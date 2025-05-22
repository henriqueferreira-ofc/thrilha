
import { useState, useEffect } from 'react';
import { isSameDay } from 'date-fns';
import { Task } from '@/types/task';
import { CalendarNavigation } from './CalendarNavigation';
import { CalendarHeader } from './CalendarHeader';
import { TaskList } from './TaskList';
import { useIsMobile } from '@/hooks/use-mobile';
import { CalendarCustom } from './CalendarCustom';
import { getHolidaysForMonth } from '@/lib/holidays';

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
  const [holidays, setHolidays] = useState<{date: Date, name: string}[]>([]);
  const isMobile = useIsMobile();

  // Carregar feriados para o mês atual
  useEffect(() => {
    if (currentMonth) {
      const monthHolidays = getHolidaysForMonth(
        currentMonth.getFullYear(), 
        currentMonth.getMonth() + 1
      );
      setHolidays(monthHolidays);
    }
  }, [currentMonth]);

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

  // Função para lidar com a seleção de uma data
  const handleDateChange = (date: Date) => {
    console.log("Data selecionada:", date);
    setSelectedDate(date);
  };

  return (
    <div className={`grid grid-cols-1 ${isMobile ? '' : 'lg:grid-cols-2'} gap-6`}>
      <div className="bg-black p-4 rounded-lg border border-white/5 shadow-md">
        <CalendarNavigation 
          currentMonth={currentMonth} 
          onNavigate={navigateMonth} 
        />
        <CalendarCustom
          value={selectedDate}
          onChange={handleDateChange}
          tasks={tasks}
          primaryColor="bg-purple-600"
          holidays={holidays}
        />
      </div>

      <div className="bg-black p-4 rounded-lg border border-white/5 shadow-md">
        <CalendarHeader 
          selectedDate={selectedDate} 
          holidayName={holidays.find(h => selectedDate && isSameDay(h.date, selectedDate))?.name}
        />
        <div className="mt-4">
          {loading ? (
            <div className="text-center py-6 text-zinc-400">
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
