import { Progress } from "@/components/ui/progress";
import { useTaskCounter } from "@/hooks/tasks/use-task-counter";

export function TaskProgress() {
  const { totalTasks, totalLimit } = useTaskCounter();
  const progressPercentage = (totalTasks / totalLimit) * 100;

  return (
    <div className="w-full space-y-1">
      <div className="flex justify-between text-xs text-gray-400">
        <span>Plano Gratuito - Tarefas {totalTasks}/{totalLimit}</span>
        <span>Restantes: {totalLimit - totalTasks}</span>
      </div>
      <Progress value={progressPercentage} className="h-2" />
    </div>
  );
}
