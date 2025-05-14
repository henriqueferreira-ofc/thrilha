
import { useTaskCounter } from '@/hooks/tasks/use-task-counter';
import { Progress } from '@/components/ui/progress';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useNavigate } from 'react-router-dom';
import { BadgePercent, Info } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export function TaskProgress() {
  const { 
    completedTasks, 
    totalLimit, 
    remainingTasks,
    showUpgradeModal,
    closeUpgradeModal,
    limitReached
  } = useTaskCounter();
  
  const navigate = useNavigate();
  
  // Calcular a porcentagem de conclusão
  const completionPercentage = Math.min(100, (completedTasks / totalLimit) * 100);
  
  const handleUpgrade = () => {
    closeUpgradeModal();
    navigate('/subscription');
  };
  
  return (
    <>
      <div className="bg-black/30 backdrop-blur-sm rounded-md p-3 mb-4">
        <div className="flex justify-between items-center mb-2">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Tarefas concluídas</span>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-4 w-4 text-gray-400 cursor-help" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p>No plano gratuito, você pode marcar até {totalLimit} tarefas como concluídas. Você pode criar quantas tarefas quiser, mas apenas {totalLimit} podem ser marcadas como concluídas.</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <span className="text-sm font-bold">{completedTasks}/{totalLimit}</span>
        </div>
        
        <Progress 
          value={completionPercentage} 
          className={limitReached ? "bg-gray-700" : "bg-gray-700"}
        />
        
        {remainingTasks > 0 ? (
          <p className="text-xs mt-2 text-gray-400">
            Você ainda pode marcar {remainingTasks} tarefa(s) como concluídas no plano gratuito.
          </p>
        ) : (
          <div className="flex items-center mt-2 space-x-2">
            <BadgePercent className="h-4 w-4 text-amber-400" />
            <p className="text-xs text-amber-400">
              Limite atingido! Faça upgrade para o plano Pro para concluir mais tarefas.
            </p>
          </div>
        )}
      </div>
      
      <AlertDialog open={showUpgradeModal} onOpenChange={closeUpgradeModal}>
        <AlertDialogContent className="glass-panel">
          <AlertDialogHeader>
            <AlertDialogTitle>Limite de tarefas concluídas atingido!</AlertDialogTitle>
            <AlertDialogDescription>
              Você atingiu o limite de {totalLimit} tarefas concluídas no plano gratuito. 
              Você ainda pode criar e gerenciar tarefas, mas não pode marcar mais tarefas como concluídas.
              <br /><br />
              Faça upgrade para o plano Pro para concluir suas tarefas sem limitações.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Depois</AlertDialogCancel>
            <AlertDialogAction onClick={handleUpgrade} className="purple-gradient-bg">
              Fazer Upgrade
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
