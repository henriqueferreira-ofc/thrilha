
import { useState, useEffect } from "react";
import { SidebarProvider } from "@/components/ui/sidebar";
import { TaskSidebar } from "@/components/task-sidebar";
import { useTasks } from "@/hooks/use-tasks";
import { CalendarContainer } from "@/components/calendar/CalendarContainer";
import { Task } from "@/types/task";

export default function CalendarPage() {
  const { tasks, loading, changeTaskStatus, deleteTask } = useTasks();
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    // Marcar como inicializado após o primeiro carregamento
    if (!isInitialized && !loading) {
      setIsInitialized(true);
    }
  }, [loading, isInitialized]);

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <TaskSidebar />
        <div className="flex-1 flex flex-col">
          <header className="p-6 flex justify-between items-center border-b border-white/10 bg-[#181926]">
            <h1 className="text-xl font-bold text-white">Calendário</h1>
          </header>
          <main className="flex-1 p-6 bg-[#181926] flex flex-col">
            <CalendarContainer 
              tasks={tasks} 
              loading={loading || !isInitialized}
              onStatusChange={changeTaskStatus}
              onDeleteTask={deleteTask}
            />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
