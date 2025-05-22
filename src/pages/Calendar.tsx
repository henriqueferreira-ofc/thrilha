import { useState } from "react";
import { SidebarProvider } from "@/components/ui/sidebar";
import { TaskSidebar } from "@/components/task-sidebar";
import { CalendarCustom } from "@/components/calendar/CalendarCustom";
import { isSameDay } from "date-fns";

export default function CalendarPage() {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());

  // Exemplo de tarefas (substitua pelo seu hook real)
  const tasks = [
    { id: 1, title: "Reunião", description: "Reunião com equipe", date: new Date(2025, 4, 21), status: "done" },
    { id: 2, title: "Entrega", description: "Entrega do projeto", date: new Date(2025, 4, 25), status: "todo" },
    { id: 3, title: "Revisão", description: "Revisar código", date: new Date(2025, 4, 21), status: "todo" },
  ];

  // Tarefas do dia selecionado
  const tasksForSelectedDate = tasks.filter(
    (t) => selectedDate && isSameDay(t.date, selectedDate)
  );

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
                <CalendarCustom value={selectedDate} onChange={setSelectedDate} tasks={tasks} primaryColor="bg-purple-600" />
              </div>
              {/* Box de informações/tarefas */}
              <div className="flex-1 bg-zinc-900 rounded-xl shadow p-6 border-b border-zinc-700 flex flex-col">
                {tasksForSelectedDate.length > 0 ? (
                  tasksForSelectedDate.map((task) => (
                    <div key={task.id} className="mb-6">
                      <h2 className="text-lg font-bold text-purple-400 mb-2">{task.title}</h2>
                      <div className="text-zinc-200 mb-1">{task.description}</div>
                      <span className={`inline-block px-2 py-1 rounded text-xs font-semibold ${task.status === 'done' ? 'bg-purple-700 text-white' : 'bg-zinc-700 text-zinc-300'}`}>
                        {task.status === 'done' ? 'Concluída' : 'Pendente'}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="text-zinc-400 mt-4">Nenhuma tarefa para esta data</div>
                )}
              </div>
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
