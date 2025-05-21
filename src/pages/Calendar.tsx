import { useEffect, useState } from 'react';
import { SidebarProvider } from '@/components/ui/sidebar';
import { TaskSidebar } from '@/components/task-sidebar';
import { useTaskCore } from '@/hooks/tasks/use-task-core';
import { useTaskOperations } from '@/hooks/tasks/use-task-operations';
import { toast } from 'sonner';
import { CalendarContainer } from '@/components/calendar/CalendarContainer';
import { TaskStatus } from '@/types/task';
import { CalendarCustom } from "@/components/calendar/CalendarCustom";

const Calendar = () => {
  // Use o hook centralizado de tarefas
  const { tasks, loading } = useTaskCore();
  const { updateTask, deleteTask, changeTaskStatus } = useTaskOperations(tasks, () => {});
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());

  useEffect(() => {
    console.log('Calendar: Tasks carregadas:', tasks.length);
  }, [tasks]);

  // Função para lidar com a mudança de status
  const handleStatusChange = async (taskId: string, newStatus: TaskStatus) => {
    try {
      await changeTaskStatus(taskId, newStatus);
    } catch (error) {
      console.error('Erro ao alterar status:', error);
      toast.error('Erro ao alterar status da tarefa');
    }
  };

  // Função para lidar com a exclusão de tarefas
  const handleDeleteTask = async (taskId: string) => {
    try {
      await deleteTask(taskId);
    } catch (error) {
      console.error('Erro ao excluir tarefa:', error);
      toast.error('Erro ao excluir tarefa');
    }
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#181926]">
        <h1 className="text-xl font-bold mb-6 text-white">Calendário</h1>
        <CalendarCustom value={selectedDate} onChange={setSelectedDate} />
        <main className="flex-1 p-6 overflow-auto">
          <CalendarContainer 
            tasks={tasks}
            loading={loading}
            onStatusChange={handleStatusChange}
            onDeleteTask={handleDeleteTask}
          />
        </main>
      </div>
    </SidebarProvider>
  );
};

export default Calendar;
