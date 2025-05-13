
import { toast } from 'sonner';
import { Task, TaskStatus, TaskFormData } from '@/types/task';
import { supabase } from '@/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { Board } from '@/types/board';

export function useTaskOperationsBoard(
  tasks: Task[], 
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>, 
  currentBoard: Board | null
) {
  const { user } = useAuth();

  // Adicionar uma nova tarefa
  const addTask = async (taskData: TaskFormData): Promise<Task | null> => {
    if (!user) {
      toast.error('Você precisa estar logado para criar tarefas');
      return null;
    }

    if (!currentBoard) {
      toast.error('Você precisa selecionar um quadro para criar tarefas');
      return null;
    }

    try {
      // Criar um ID temporário para a tarefa
      const tempId = crypto.randomUUID();
      
      // Criar a nova tarefa com dados temporários
      const newTask: Task = {
        id: tempId,
        title: taskData.title,
        description: taskData.description || '',
        status: 'todo',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        due_date: taskData.dueDate,
        user_id: user.id,
        board_id: currentBoard.id,
        completed: false
      };

      // Atualizar o estado local imediatamente
      setTasks(prev => [newTask, ...prev]);

      // Enviar para o banco de dados
      const { data, error } = await supabase
        .from('tasks')
        .insert({
          title: taskData.title,
          description: taskData.description || '',
          status: 'todo' as TaskStatus,
          user_id: user.id,
          board_id: currentBoard.id,
          due_date: taskData.dueDate
        })
        .select()
        .single();

      if (error) {
        // Se houver erro, remover a tarefa temporária do estado local
        setTasks(prev => prev.filter(task => task.id !== tempId));
        throw error;
      }

      // Atualizar o estado local com os dados reais do banco
      const formattedTask: Task = {
        id: data.id,
        title: data.title,
        description: data.description || '',
        status: data.status as TaskStatus,
        created_at: data.created_at,
        updated_at: data.updated_at,
        due_date: data.due_date,
        user_id: data.user_id,
        board_id: data.board_id,
        completed: data.status === 'done'
      };

      setTasks(prev => prev.map(task => 
        task.id === tempId ? formattedTask : task
      ));

      toast.success('Tarefa criada com sucesso!');
      return formattedTask;
    } catch (error: unknown) {
      console.error('Erro ao criar tarefa:', error);
      toast.error(error instanceof Error ? error.message : 'Erro ao criar tarefa');
      return null;
    }
  };

  // Atualizar uma tarefa
  const updateTask = async (id: string, updatedData: Partial<Task>): Promise<void> => {
    if (!user) {
      toast.error('Você precisa estar logado para atualizar tarefas');
      return;
    }

    try {
      // Converter de volta para o formato do banco de dados
      const dbData = {
        title: updatedData.title,
        description: updatedData.description,
        status: updatedData.status,
        due_date: updatedData.due_date
      };

      const { error } = await supabase
        .from('tasks')
        .update(dbData)
        .eq('id', id);

      if (error) throw error;

      // Atualizar o estado local
      setTasks(prev => prev.map(task => 
        task.id === id ? { ...task, ...updatedData, completed: updatedData.status === 'done' || (task.completed || false) } : task
      ));

      toast.success('Tarefa atualizada com sucesso!');
    } catch (error: unknown) {
      console.error('Erro ao atualizar tarefa:', error);
      toast.error(error instanceof Error ? error.message : 'Erro ao atualizar tarefa');
    }
  };

  // Excluir uma tarefa
  const deleteTask = async (id: string) => {
    if (!user) {
      toast.error('Você precisa estar logado para excluir tarefas');
      return;
    }

    try {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', id);

      if (error) throw error;

      // Atualizar o estado local
      setTasks(prev => prev.filter(task => task.id !== id));
      toast.success('Tarefa removida com sucesso!');
    } catch (error: unknown) {
      console.error('Erro ao excluir tarefa:', error);
      toast.error('Erro ao excluir tarefa');
    }
  };

  // Alterar o status de uma tarefa
  const changeTaskStatus = async (taskId: string, newStatus: TaskStatus) => {
    if (!user) {
      toast.error('Você precisa estar logado para atualizar tarefas');
      return;
    }

    try {
      // Atualizar o estado local imediatamente
      setTasks(prev => 
        prev.map(task => 
          task.id === taskId 
            ? { ...task, status: newStatus, completed: newStatus === 'done' }
            : task
        )
      );

      // Atualizar no banco de dados
      const { error } = await supabase
        .from('tasks')
        .update({ status: newStatus })
        .eq('id', taskId);

      if (error) {
        // Se houver erro, reverter a alteração local
        setTasks(prev => 
          prev.map(task => 
            task.id === taskId 
              ? { ...task, status: task.status }
              : task
          )
        );
        throw error;
      }

      toast.success(`Status da tarefa alterado para ${getStatusName(newStatus)}!`);
    } catch (error: unknown) {
      console.error('Erro ao atualizar status da tarefa:', error);
      toast.error('Erro ao atualizar status da tarefa');
    }
  };

  // Função auxiliar para obter o nome legível do status
  const getStatusName = (status: TaskStatus): string => {
    switch (status) {
      case 'todo': return 'A Fazer';
      case 'in-progress': return 'Em Progresso';
      case 'done': return 'Concluída';
      default: return status;
    }
  };
  
  return {
    addTask,
    updateTask,
    deleteTask,
    changeTaskStatus
  };
}
