
import { useEffect } from 'react';
import { SidebarProvider } from '@/components/ui/sidebar';
import { TaskSidebar } from '@/components/task-sidebar';
import { useTaskCore } from '@/hooks/tasks/use-task-core';
import { useTaskOperations } from '@/hooks/tasks/use-task-operations';
import { toast } from 'sonner';
import { CalendarContainer } from '@/components/calendar/CalendarContainer';
import { TaskStatus } from '@/types/task';

const Calendar = () => {
  // Use o hook centralizado de tarefas
  const { tasks, loading } = useTaskCore();
  const { updateTask, deleteTask, changeTaskStatus } = useTaskOperations(tasks, () => {});

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
      <div className="min-h-screen flex w-full">
        <TaskSidebar />
        
        <div className="flex-1 flex flex-col">
          <header className="p-6 flex justify-between items-center border-b border-white/10">
            <h1 className="text-xl font-bold purple-gradient-text">Calendário</h1>
            {loading && <span className="text-sm text-muted-foreground">Carregando tarefas...</span>}
          </header>
          
          <main className="flex-1 p-6 overflow-auto">
            <CalendarContainer 
              tasks={tasks}
              loading={loading}
              onStatusChange={handleStatusChange}
              onDeleteTask={handleDeleteTask}
            />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default Calendar;
