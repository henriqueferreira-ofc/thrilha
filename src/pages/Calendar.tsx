
import { useState, useEffect } from 'react';
import { SidebarProvider } from '@/components/ui/sidebar';
import { TaskSidebar } from '@/components/task-sidebar';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { format, isSameDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CalendarIcon, Check, Circle, ChevronLeft, ChevronRight } from 'lucide-react';
import { Task } from '@/types/task';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useTaskCore } from '@/hooks/tasks/use-task-core';
import { useTaskOperations } from '@/hooks/tasks/use-task-operations';
import { toast } from 'sonner';
import { useIsMobile } from '@/hooks/use-mobile';

const Calendar = () => {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const isMobile = useIsMobile();
  
  // Use o hook centralizado de tarefas
  const { tasks, loading } = useTaskCore();
  const { updateTask, deleteTask, changeTaskStatus } = useTaskOperations(tasks, () => {});

  useEffect(() => {
    console.log('Calendar: Tasks carregadas:', tasks.length);
  }, [tasks]);

  // Filtrar tarefas pela data selecionada
  const tasksForSelectedDate = tasks.filter((task) => {
    if (!selectedDate || !task.due_date) return false;
    
    const taskDate = new Date(task.due_date);
    return isSameDay(taskDate, selectedDate);
  });

  // Função para determinar que dias devem ser destacados no calendário (dias com tarefas)
  const getDaysWithTasks = tasks
    .filter((task) => task.due_date)
    .map((task) => new Date(task.due_date!));

  // Função para renderizar o indicador de status da tarefa
  const renderStatusIndicator = (status: Task['status']) => {
    switch (status) {
      case 'todo':
        return <Circle className="h-4 w-4 text-muted-foreground" />;
      case 'in-progress':
        return <Circle className="h-4 w-4 text-blue-500 fill-blue-500/30" />;
      case 'done':
        return <Check className="h-4 w-4 text-green-500" />;
      default:
        return null;
    }
  };

  // Função para formatar a data selecionada
  const formattedDate = selectedDate
    ? format(selectedDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
    : 'Selecione uma data';

  // Função para lidar com a mudança de mês
  const handleMonthChange = (month: Date) => {
    setCurrentMonth(month);
  };

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

  // Função para lidar com a mudança de status
  const handleStatusChange = async (taskId: string, newStatus: Task['status']) => {
    try {
      await changeTaskStatus(taskId, newStatus);
    } catch (error) {
      console.error('Erro ao alterar status:', error);
      toast.error('Erro ao alterar status da tarefa');
    }
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <TaskSidebar />
        
        <div className="flex-1 flex flex-col">
          <header className="p-6 flex justify-between items-center border-b border-white/10">
            <h1 className="text-xl font-bold">Calendário</h1>
            {loading && <span className="text-sm text-muted-foreground">Carregando tarefas...</span>}
          </header>
          
          <main className="flex-1 p-6 overflow-auto">
            <div className={`grid grid-cols-1 ${isMobile ? '' : 'lg:grid-cols-2'} gap-6`}>
              <div className="bg-black p-4 rounded-lg border border-white/10">
                {/* Navegação customizada do calendário */}
                <div className="flex justify-between items-center mb-2">
                  <button 
                    onClick={() => navigateMonth('prev')}
                    className="p-2 hover:bg-gray-800 rounded-full transition-colors"
                  >
                    <ChevronLeft className="h-5 w-5 text-white" />
                  </button>
                  <h2 className="text-xl font-bold uppercase tracking-wider text-white">
                    {format(currentMonth, "MMMM 'DE' yyyy", { locale: ptBR })}
                  </h2>
                  <button 
                    onClick={() => navigateMonth('next')}
                    className="p-2 hover:bg-gray-800 rounded-full transition-colors"
                  >
                    <ChevronRight className="h-5 w-5 text-white" />
                  </button>
                </div>

                <CalendarComponent
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  className="bg-[#1a1c23] rounded-lg"
                  month={currentMonth}
                  onMonthChange={handleMonthChange}
                  modifiers={{
                    highlighted: getDaysWithTasks,
                  }}
                  modifiersClassNames={{
                    highlighted: "relative after:absolute after:bottom-1 after:left-1/2 after:-translate-x-1/2 after:w-1 after:h-1 after:rounded-full after:bg-blue-500",
                  }}
                  locale={ptBR}
                />
              </div>

              <div className="bg-black p-4 rounded-lg border border-white/10">
                <div className="mb-4">
                  <h2 className="text-lg font-semibold flex items-center gap-2">
                    <CalendarIcon className="h-5 w-5 text-blue-500" />
                    {formattedDate}
                  </h2>
                </div>
                <div className="mt-4">
                  {tasksForSelectedDate.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Status</TableHead>
                          <TableHead>Título</TableHead>
                          <TableHead>Descrição</TableHead>
                          <TableHead>Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {tasksForSelectedDate.map((task) => (
                          <TableRow key={task.id}>
                            <TableCell>
                              <button
                                onClick={() => handleStatusChange(task.id, task.status === 'done' ? 'todo' : 'done')}
                                className="hover:opacity-80 transition-opacity"
                              >
                                {renderStatusIndicator(task.status)}
                              </button>
                            </TableCell>
                            <TableCell className="font-medium">{task.title}</TableCell>
                            <TableCell className="text-muted-foreground">{task.description || '-'}</TableCell>
                            <TableCell>
                              <button
                                onClick={() => deleteTask(task.id)}
                                className="text-red-500 hover:text-red-400 transition-colors"
                              >
                                Excluir
                              </button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <div className="text-center py-6 text-muted-foreground">
                      {selectedDate 
                        ? 'Nenhuma tarefa para esta data' 
                        : 'Selecione uma data para ver as tarefas'}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default Calendar;
