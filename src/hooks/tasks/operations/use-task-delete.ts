
import { toast } from '@/hooks/toast';
import { Task } from '@/types/task';
import { supabase } from '@/supabase/client';
import { useTaskCounter } from '../use-task-counter';
import { Board } from '@/types/board';
import { User } from '@supabase/supabase-js';

export function useTaskDelete(
  tasks: Task[], 
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>, 
  user: User | null,
  currentBoard: Board | null
) {
  const { decrementCompletedTasks, syncCompletedTasksCount } = useTaskCounter(currentBoard);

  // Excluir uma tarefa
  const deleteTask = async (id: string): Promise<boolean> => {
    if (!user) {
      toast.error('Você precisa estar logado para excluir tarefas');
      return false;
    }

    try {
      // Verificar se a tarefa que está sendo excluída está concluída
      const taskToDelete = tasks.find(task => task.id === id);
      if (!taskToDelete) {
        console.error('Tarefa não encontrada:', id);
        return false;
      }
      
      const isCompletedTask = taskToDelete && taskToDelete.status === 'done';
      
      console.log(`Excluindo tarefa ${id}, status: ${isCompletedTask ? 'concluída' : 'não concluída'}`);
      
      // Atualização otimista - remover a tarefa imediatamente da interface
      setTasks(prev => prev.filter(task => task.id !== id));
      
      // Atualizar o contador imediatamente
      if (isCompletedTask) {
        console.log('Decrementando contador de tarefas concluídas após exclusão');
        decrementCompletedTasks();
      }
      
      // Enviar para o backend
      console.log('Enviando exclusão para o servidor...');
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) {
        // Reverter a atualização otimista em caso de erro
        console.error('Erro na exclusão, revertendo alterações locais:', error);
        if (taskToDelete) {
          setTasks(prev => [...prev, taskToDelete]);
          // Reverter a atualização do contador também
          if (isCompletedTask) {
            syncCompletedTasksCount();
          }
        }
        throw error;
      }
      
      // Verificar se a tarefa ainda existe (pode falhar silenciosamente)
      const { data: checkData } = await supabase
        .from('tasks')
        .select('id')
        .eq('id', id)
        .maybeSingle();
        
      if (checkData) {
        console.error('Tarefa ainda existe após exclusão, tentando novamente...');
        await supabase
          .from('tasks')
          .delete()
          .eq('id', id)
          .eq('user_id', user.id);
      }
      
      // Sincronizar o contador após a exclusão bem-sucedida
      await syncCompletedTasksCount();
      
      // Garantir que as mudanças sejam refletidas em outras partes da aplicação
      console.log('Tarefa excluída com sucesso');
      return true;
    } catch (error) {
      console.error('Erro ao excluir tarefa:', error);
      toast.error('Erro ao excluir tarefa');
      return false;
    }
  };

  return { deleteTask };
}
