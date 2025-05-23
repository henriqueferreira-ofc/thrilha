
import { useState, useEffect } from 'react';
import { isSameDay, format, startOfDay } from 'date-fns';
import { Task } from '@/types/task';
import { CalendarHeader } from './CalendarHeader';
import { TaskList } from './TaskList';
import { useIsMobile } from '@/hooks/use-mobile';
import { CalendarCustom } from './CalendarCustom';
import { getHolidaysForMonth } from '@/lib/holidays';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { CalendarPlus } from 'lucide-react';
import { TaskForm } from '@/components/task-form';
import { TaskFormData } from '@/types/task';

interface CalendarContainerProps {
  tasks: Task[];
  loading: boolean;
  onStatusChange: (taskId: string, newStatus: Task['status']) => Promise<void>;
  onDeleteTask: (taskId: string) => Promise<void>;
  onAddTask?: (data: TaskFormData) => Promise<void>;
}

export const CalendarContainer = ({
  tasks,
  loading,
  onStatusChange,
  onDeleteTask,
  onAddTask
}: CalendarContainerProps) => {
  // Começar com a data de hoje pré-selecionada
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [holidays, setHolidays] = useState<{date: Date, name: string}[]>([]);
  const [isCreateSheetOpen, setIsCreateSheetOpen] = useState(false);
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

  // Função para lidar com a seleção de uma data
  const handleDateChange = (date: Date) => {
    // Garantir que a data seja criada como meia-noite no fuso local
    const newDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    setSelectedDate(newDate);
    console.log('Data selecionada:', format(newDate, 'dd/MM/yyyy'));
  };

  // Filtrar tarefas pela data selecionada
  const tasksForSelectedDate = tasks.filter((task) => {
    if (!selectedDate || !task.due_date) return false;
    
    const taskDate = new Date(task.due_date);
    const taskDay = startOfDay(taskDate);
    const selectedDay = startOfDay(selectedDate);
    
    // Comparando as datas com startOfDay para normalizar a comparação
    const isMatch = isSameDay(taskDay, selectedDay);
    
    console.log('Comparando', {
      taskDateStr: format(taskDate, 'yyyy-MM-dd'),
      selectedDateStr: format(selectedDate, 'yyyy-MM-dd'),
      isMatch
    });
    
    return isMatch;
  });

  // Função para criar uma nova tarefa
  const handleCreateTask = async (data: TaskFormData) => {
    if (onAddTask) {
      // Se a data não foi especificada mas estamos em um dia específico,
      // use a data selecionada
      if (!data.dueDate && selectedDate) {
        data.dueDate = selectedDate.toISOString();
      }
      await onAddTask(data);
      setIsCreateSheetOpen(false);
    }
  };

  return (
    <div className={`grid grid-cols-1 ${isMobile ? '' : 'lg:grid-cols-2'} gap-6`}>
      <div className="bg-black p-4 rounded-lg border border-white/5 shadow-md">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">Calendário de Tarefas</h2>
          <Sheet open={isCreateSheetOpen} onOpenChange={setIsCreateSheetOpen}>
            <SheetTrigger asChild>
              <Button className="bg-purple-600 hover:bg-purple-700">
                <CalendarPlus className="h-4 w-4 mr-2" />
                Nova Tarefa
              </Button>
            </SheetTrigger>
            <SheetContent className="bg-[#1a1c23] border-white/10 text-white">
              <h3 className="text-lg font-semibold mb-4">Criar Nova Tarefa</h3>
              <TaskForm 
                onSubmit={handleCreateTask}
                initialData={
                  selectedDate ? { dueDate: selectedDate.toISOString() } : {}
                }
              />
            </SheetContent>
          </Sheet>
        </div>
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
