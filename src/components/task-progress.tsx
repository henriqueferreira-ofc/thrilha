
import { useTaskCounter } from '@/hooks/tasks/use-task-counter';
import { Progress } from '@/components/ui/progress';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useNavigate } from 'react-router-dom';
import { BadgePercent } from 'lucide-react';

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
          <span className="text-sm font-medium">Tarefas concluídas (Plano Gratuito)</span>
          <span className="text-sm font-bold">{completedTasks}/{totalLimit}</span>
        </div>
        
        <Progress 
          value={completionPercentage} 
          className={limitReached ? "bg-gray-700" : "bg-gray-700"}
        />
        
        {remainingTasks > 0 ? (
          <p className="text-xs mt-2 text-gray-400">
            Você ainda pode concluir {remainingTasks} tarefa(s) no plano gratuito.
          </p>
        ) : (
          <div className="flex items-center mt-2 space-x-2">
            <BadgePercent className="h-4 w-4 text-amber-400" />
            <p className="text-xs text-amber-400">
              Limite atingido! Faça upgrade para o plano Pro para criar e concluir mais tarefas.
            </p>
          </div>
        )}
      </div>
      
      <AlertDialog open={showUpgradeModal} onOpenChange={closeUpgradeModal}>
        <AlertDialogContent className="glass-panel">
          <AlertDialogHeader>
            <AlertDialogTitle>Limite de tarefas atingido!</AlertDialogTitle>
            <AlertDialogDescription>
              Você atingiu o limite de {totalLimit} tarefas concluídas no plano gratuito. 
              Faça upgrade para o plano Pro para continuar gerenciando suas tarefas sem limitações.
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
