
import { toast } from '@/hooks/toast';
import { Task } from '@/types/task';
import { supabase } from '@/supabase/client';
import { useTaskCounter } from '../use-task-counter';

export function useTaskDelete(
  tasks: Task[], 
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>, 
  user: any | null
) {
  // Integrar o contador de tarefas
  const { decrementCompletedTasks } = useTaskCounter();

  // Excluir uma tarefa
  const deleteTask = async (id: string) => {
    if (!user) {
      toast.error('Você precisa estar logado para excluir tarefas');
      return;
    }

    try {
      // Verificar se a tarefa que está sendo excluída está concluída
      const taskToDelete = tasks.find(task => task.id === id);
      if (!taskToDelete) {
        console.error('Tarefa não encontrada:', id);
        return;
      }
      
      const isCompletedTask = taskToDelete && taskToDelete.status === 'done';
      
      console.log(`Excluindo tarefa ${id}, status: ${isCompletedTask ? 'concluída' : 'não concluída'}`);
      
      // Atualização otimista - remover a tarefa imediatamente da interface
      setTasks(prev => prev.filter(task => task.id !== id));
      
      // Enviar para o backend
      console.log('Enviando exclusão para o servidor...');
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', id);

      if (error) {
        // Reverter a atualização otimista em caso de erro
        console.error('Erro na exclusão, revertendo alterações locais:', error);
        if (taskToDelete) {
          setTasks(prev => [...prev, taskToDelete]);
        }
        throw error;
      }
      
      // Se a tarefa excluída estava concluída, decrementar o contador
      if (isCompletedTask) {
        console.log('Decrementando contador de tarefas concluídas após exclusão');
        decrementCompletedTasks();
      }
      
      console.log(`Tarefa ${id} excluída com sucesso`);
      toast.success('Tarefa removida com sucesso!');
    } catch (error: unknown) {
      console.error('Erro ao excluir tarefa:', error);
      toast.error('Erro ao excluir tarefa');
    }
  };

  return { deleteTask };
}
