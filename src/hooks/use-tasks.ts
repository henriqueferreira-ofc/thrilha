import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './use-auth';
import { useTaskCore } from './tasks/use-task-core';
import { useTaskOperations } from './tasks/use-task-operations';
import { useTaskCollaborators } from './tasks/use-task-collaborators';
import toast from 'react-hot-toast';

export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  // Load tasks from Supabase when component mounts
  useEffect(() => {
    if (!user) return;

    const fetchTasks = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('tasks')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;

        const formattedTasks: Task[] = data?.map((task: TaskRow) => ({
          id: task.id,
          title: task.title,
          description: task.description || '',
          status: task.status as TaskStatus,
          createdAt: task.created_at,
          dueDate: task.due_date
        })) || [];
        
        setTasks(formattedTasks);
      } catch (error: any) {
        console.error('Error fetching tasks:', error.message);
        toast.error('Error loading tasks');
      } finally {
        setLoading(false);
      }
    };

    fetchTasks();

    // Set up real-time subscription
    const tasksSubscription = supabase
      .channel('public:tasks')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public',
        table: 'tasks'
      }, (payload) => {
        if (payload.eventType === 'INSERT') {
          const newTask = payload.new as TaskRow;
          if (newTask.user_id === user.id) {
            const formattedTask: Task = {
              id: newTask.id,
              title: newTask.title,
              description: newTask.description || '',
              status: newTask.status as TaskStatus,
              createdAt: newTask.created_at,
              dueDate: newTask.due_date
            };
            setTasks(prev => [formattedTask, ...prev]);
          }
        } else if (payload.eventType === 'UPDATE') {
          const updatedTask = payload.new as TaskRow;
          if (updatedTask.user_id === user.id) {
            setTasks(prev => 
              prev.map(task => task.id === updatedTask.id ? {
                id: updatedTask.id,
                title: updatedTask.title,
                description: updatedTask.description || '',
                status: updatedTask.status as TaskStatus,
                createdAt: updatedTask.created_at,
                dueDate: updatedTask.due_date
              } : task)
            );
          }
        } else if (payload.eventType === 'DELETE') {
          const deletedTaskId = payload.old.id;
          if (payload.old.user_id === user.id) {
            setTasks(prev => prev.filter(task => task.id !== deletedTaskId));
          }
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(tasksSubscription);
    };
  }, [user]);

  // Add a new task
  const addTask = async (taskData: TaskFormData): Promise<Task | null> => {
    if (!user) {
      toast.error('You need to be logged in to create tasks');
      return null;
    }

    try {
      const tempId = crypto.randomUUID();
      const newTask: Task = {
        id: tempId,
        title: taskData.title,
        description: taskData.description || '',
        status: 'todo',
        createdAt: new Date().toISOString(),
        dueDate: taskData.dueDate
      };

      setTasks(prev => [newTask, ...prev]);

      const { data, error } = await supabase
        .from('tasks')
        .insert({
          title: taskData.title,
          description: taskData.description || '',
          status: 'todo' as TaskStatus,
          user_id: user.id,
          due_date: taskData.dueDate
        })
        .select()
        .single();

      if (error) {
        setTasks(prev => prev.filter(task => task.id !== tempId));
        throw error;
      }

      const formattedTask: Task = {
        id: data.id,
        title: data.title,
        description: data.description || '',
        status: data.status as TaskStatus,
        createdAt: data.created_at,
        dueDate: data.due_date
      };

      setTasks(prev => prev.map(task => 
        task.id === tempId ? formattedTask : task
      ));

      toast.success('Task created successfully!');
      return formattedTask;
    } catch (error: any) {
      console.error('Error creating task:', error);
      toast.error(error instanceof Error ? error.message : 'Error creating task');
      return null;
    }
  };

  // Update a task
  const updateTask = async (id: string, updatedData: Partial<Task>): Promise<void> => {
    if (!user) {
      toast.error('You need to be logged in to update tasks');
      return;
    }

    try {
      const dbData: Partial<TaskRow> = {
        title: updatedData.title,
        description: updatedData.description,
        status: updatedData.status,
        due_date: updatedData.dueDate
      };

      const { error } = await supabase
        .from('tasks')
        .update(dbData)
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      toast.success('Task updated successfully!');
    } catch (error: any) {
      console.error('Error updating task:', error);
      toast.error(error instanceof Error ? error.message : 'Error updating task');
    }
  };

  // Delete a task
  const deleteTask = async (id: string) => {
    if (!user) {
      toast.error('You need to be logged in to delete tasks');
      return;
    }

    try {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      setTasks(prev => prev.filter(task => task.id !== id));
      toast.success('Task deleted successfully!');
    } catch (error: any) {
      console.error('Error deleting task:', error);
      toast.error('Error deleting task');
    }
  };

  // Change task status
  const changeTaskStatus = async (taskId: string, newStatus: TaskStatus) => {
    if (!user) {
      toast.error('You need to be logged in to change task status');
      return;
    }

    try {
      const currentTask = tasks.find(task => task.id === taskId);
      if (!currentTask) throw new Error('Task not found');

      setTasks(prev => 
        prev.map(task => 
          task.id === taskId 
            ? { ...task, status: newStatus }
            : task
        )
      );

      const { error } = await supabase
        .from('tasks')
        .update({ status: newStatus })
        .eq('id', taskId)
        .eq('user_id', user.id);

      if (error) {
        setTasks(prev => 
          prev.map(task => 
            task.id === taskId 
              ? { ...task, status: currentTask.status }
              : task
          )
        );
        throw error;
      }

      toast.success(`Task status changed to ${getStatusName(newStatus)}!`);
    } catch (error: any) {
      console.error('Error updating task status:', error);
      toast.error('Error updating task status');
    }
  };

  // Helper function to get readable status name
  const getStatusName = (status: TaskStatus): string => {
    switch (status) {
      case 'todo': return 'To Do';
      case 'inProgress': return 'In Progress';
      case 'done': return 'Done';
      default: return status;
    }
  };

  // Import collaborator functionality
  const { addCollaborator, removeCollaborator, getTaskCollaborators, isTaskOwner } = useTaskCollaborators();

  return {
    tasks,
    loading,
    addTask,
    updateTask,
    deleteTask,
    changeTaskStatus,
    addCollaborator,
    removeCollaborator,
    getTaskCollaborators,
    isTaskOwner
  };
}

// Type definitions (you might need to adjust these based on your actual types)
interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  createdAt: string;
  dueDate?: string;
}

interface TaskRow {
  id: string;
  title: string;
  description?: string;
  status: string;
  created_at: string;
  due_date?: string;
  user_id: string;
}

interface TaskFormData {
  title: string;
  description?: string;
  dueDate?: string;
}

type TaskStatus = 'todo' | 'inProgress' | 'done';