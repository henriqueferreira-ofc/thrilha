
import { toast } from '@/hooks/toast';
import { Task, TaskStatus } from '@/types/task';
import { supabase } from '@/supabase/client';
import { User } from '@supabase/supabase-js';

export function useTaskStatus(
  tasks: Task[],
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>,
  user: User | null
) {
  // Alterar o status de uma tarefa
  const changeTaskStatus = async (taskId: string, newStatus: TaskStatus) => {
    if (!user) {
      toast.error('Você precisa estar logado para alterar o status da tarefa');
      return;
    }

    // Encontrar a tarefa atual
    const task = tasks.find(t => t.id === taskId);
    
    if (!task) {
      console.error('Tarefa não encontrada:', taskId);
      return;
    }

    try {
      console.log(`Alterando status da tarefa ${taskId} de "${task.status}" para "${newStatus}"`);
      
      // Atualizar o estado local imediatamente para melhor experiência do usuário
      setTasks(prev => {
        return prev.map(t => 
          t.id === taskId
            ? { ...t, status: newStatus }
            : t
        );
      });

      // Enviar atualização para o backend
      console.log('Enviando atualização de status para o servidor...');
      const { error } = await supabase
        .from('tasks')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString() 
        })
        .eq('id', taskId);

      if (error) {
        console.error('Erro ao atualizar status no servidor:', error);
        
        // Reverter alteração em caso de erro
        setTasks(prev =>
          prev.map(t =>
            t.id === taskId ? { ...t, status: task.status } : t
          )
        );
        
        throw error;
      }
      
      console.log(`Status da tarefa ${taskId} atualizado com sucesso para "${newStatus}"`);
    } catch (error) {
      console.error('Erro ao atualizar status da tarefa:', error);
      toast.error('Erro ao atualizar status da tarefa');
    }
  };

  return { changeTaskStatus };
}
