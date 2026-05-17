
import { useState, useEffect } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { TaskSidebar } from "@/components/task-sidebar";
import { useTasks } from "@/hooks/use-tasks";
import { CalendarContainer } from "@/components/calendar/CalendarContainer";
import { TaskFormData } from "@/types/task";

export default function CalendarPage() {
  const { tasks, loading, changeTaskStatus, deleteTask, addTask } = useTasks();
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    // Marcar como inicializado após o primeiro carregamento
    if (!isInitialized && !loading) {
      setIsInitialized(true);
    }
  }, [loading, isInitialized]);

  // Função para criar tarefa diretamente da página de calendário
  const handleAddTask = async (data: TaskFormData) => {
    try {
      await addTask(data);
    } catch (error) {
      console.error("Erro ao adicionar tarefa:", error);
    }
  };

  return (
    <SidebarProvider>
      <div className="page-wrapper mountain-pattern">
        <TaskSidebar hideDefaultTrigger />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="page-header backdrop-blur-sm bg-black/20">
            <div className="flex items-center gap-3 text-white min-w-0 flex-1">
              <SidebarTrigger className="md:hidden h-10 w-10 text-white/90 [&>svg]:h-6 [&>svg]:w-6" aria-label="Abrir menu" />
              <h1 className="text-xl font-bold purple-gradient-text truncate">Calendário</h1>
            </div>
          </header>
          <main className="page-main flex flex-col gap-4">
            <CalendarContainer 
              tasks={tasks} 
              loading={loading || !isInitialized}
              onStatusChange={changeTaskStatus}
              onDeleteTask={deleteTask}
              onAddTask={handleAddTask}
            />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
