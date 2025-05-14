import { useEffect } from 'react';
import { Progress } from "@/components/ui/progress";
import { useTaskCounter } from "@/hooks/tasks/use-task-counter";
import { Board } from "@/types/board";

interface TaskProgressProps {
  currentBoard: Board | null;
}

export function TaskProgress({ currentBoard }: TaskProgressProps) {
  const { totalTasks, totalLimit, syncCompletedTasksCount } = useTaskCounter(currentBoard);
  const progressPercentage = (totalTasks / totalLimit) * 100;

  // Sincronizar o contador quando o componente montar ou quando mudar o quadro
  useEffect(() => {
    if (currentBoard) {
      syncCompletedTasksCount();
    }
  }, [currentBoard, syncCompletedTasksCount]);

  return (
    <div className="w-full space-y-1">
      <div className="flex justify-between text-xs text-gray-400">
        <span>Total de Tarefas: {totalTasks}/{totalLimit}</span>
        <span>Tarefas Disponíveis: {totalLimit - totalTasks}</span>
      </div>
      <Progress value={progressPercentage} className="h-2" />
    </div>
  );
}
