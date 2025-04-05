
import { useState } from 'react';
import { SidebarProvider } from '@/components/ui/sidebar';
import { TaskSidebar } from '@/components/task-sidebar';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { format, parse, isValid } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CalendarIcon, Check, Circle } from 'lucide-react';
import { useTasks } from '@/hooks/use-tasks';
import { Task } from '@/types/task';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

const Calendar = () => {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const { tasks } = useTasks();

  // Filtrar tarefas pela data selecionada
  const tasksForSelectedDate = tasks.filter((task) => {
    if (!selectedDate || !task.dueDate) return false;
    
    // Converter a string de data para um objeto Date
    const taskDate = new Date(task.dueDate);
    return (
      taskDate.getDate() === selectedDate.getDate() &&
      taskDate.getMonth() === selectedDate.getMonth() &&
      taskDate.getFullYear() === selectedDate.getFullYear()
    );
  });

  // Função para determinar que dias devem ser destacados no calendário (dias com tarefas)
  const getDaysWithTasks = tasks
    .filter((task) => task.dueDate)
    .map((task) => new Date(task.dueDate!));

  // Função para renderizar o indicador de status da tarefa
  const renderStatusIndicator = (status: Task['status']) => {
    switch (status) {
      case 'todo':
        return <Circle className="h-4 w-4 text-muted-foreground" />;
      case 'inProgress':
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

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <TaskSidebar />
        
        <div className="flex-1 flex flex-col">
          <header className="p-6 flex justify-between items-center border-b border-white/10">
            <h1 className="text-xl font-bold">Calendário</h1>
          </header>
          
          <main className="flex-1 p-6 overflow-auto">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="glass-panel p-4 rounded-lg lg:col-span-1">
                <CalendarComponent
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  className="p-3 pointer-events-auto"
                  modifiers={{
                    highlighted: getDaysWithTasks,
                  }}
                  modifiersClassNames={{
                    highlighted: "bg-purple-900/30 text-white",
                  }}
                  locale={ptBR}
                />
              </div>

              <div className="glass-panel p-4 rounded-lg lg:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CalendarIcon className="h-5 w-5" />
                    {formattedDate}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {tasksForSelectedDate.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Status</TableHead>
                          <TableHead>Título</TableHead>
                          <TableHead>Descrição</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {tasksForSelectedDate.map((task) => (
                          <TableRow key={task.id}>
                            <TableCell>{renderStatusIndicator(task.status)}</TableCell>
                            <TableCell className="font-medium">{task.title}</TableCell>
                            <TableCell className="text-muted-foreground">{task.description || '-'}</TableCell>
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
                </CardContent>
              </div>
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default Calendar;
