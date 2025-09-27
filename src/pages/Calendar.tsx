
import { useState, useEffect } from "react";
import { SidebarProvider } from "@/components/ui/sidebar";
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
      <div className="page-wrapper">
        <TaskSidebar />
        <div className="flex-1 flex flex-col">
          <header className="page-header bg-black">
            <h1 className="text-xl font-bold purple-gradient-text">Calendário</h1>
          </header>
          <main className="page-main bg-black flex flex-col gap-4">
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
