
import { Progress } from "@/components/ui/progress";
import { useTaskCounter } from "@/hooks/tasks/use-task-counter";

export function TaskProgress() {
  const { createdTasks, remainingTasks, totalLimit } = useTaskCounter();
  const progressPercentage = (createdTasks / totalLimit) * 100;

  return (
    <div className="w-full space-y-1">
      <div className="flex justify-between text-xs text-gray-400">
        <span>Tarefas criadas: {createdTasks}/{totalLimit}</span>
        <span>Restantes: {remainingTasks}</span>
      </div>
      <Progress value={progressPercentage} className="h-2" />
    </div>
  );
}
