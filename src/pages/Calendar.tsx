import { useState } from "react";
import { SidebarProvider } from "@/components/ui/sidebar";
import { TaskSidebar } from "@/components/task-sidebar";
import { CalendarCustom } from "@/components/calendar/CalendarCustom";

export default function CalendarPage() {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());

  // Exemplo de tarefas (substitua pelo seu hook real)
  const tasksForSelectedDate = [];

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <TaskSidebar />
        <div className="flex-1 flex flex-col">
          <header className="p-6 flex justify-between items-center border-b border-white/10 backdrop-blur-sm bg-black/20">
            <h1 className="text-xl font-bold text-white">Calendário</h1>
          </header>
          <main className="flex-1 p-6 bg-[#181926] flex flex-col">
            <div className="flex flex-col lg:flex-row gap-6 w-full h-full">
              {/* Box do calendário */}
              <div className="flex-1 bg-zinc-900 rounded-xl shadow p-6 border-b border-zinc-700 flex flex-col items-center">
                <CalendarCustom value={selectedDate} onChange={setSelectedDate} />
              </div>
              {/* Box de informações/tarefas */}
              <div className="flex-1 bg-zinc-900 rounded-xl shadow p-6 border-b border-zinc-700 flex flex-col">
                <h2 className="text-lg font-semibold text-white mb-4">
                  {selectedDate
                    ? selectedDate.toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })
                    : "Selecione uma data"}
                </h2>
                {tasksForSelectedDate.length > 0 ? (
                  <ul className="space-y-2">
                    {tasksForSelectedDate.map((task) => (
                      <li key={task.id} className="text-zinc-200">
                        <span className="font-bold">{task.title}</span>
                        <span className="ml-2 text-zinc-400">{task.description}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="text-zinc-400">Nenhuma tarefa para esta data</div>
                )}
              </div>
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
