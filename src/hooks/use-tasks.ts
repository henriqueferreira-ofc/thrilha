
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Task, TaskStatus, TaskFormData } from '../types/task';
import { generateId, getStoredTasks, saveTasks } from '../lib/task-utils';

export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [deletedTask, setDeletedTask] = useState<Task | null>(null);

  // Load tasks from storage on initial render
  useEffect(() => {
    setTasks(getStoredTasks());
  }, []);

  // Save tasks to storage whenever they change
  useEffect(() => {
    if (tasks.length > 0) {
      saveTasks(tasks);
    }
  }, [tasks]);

  // Add a new task
  const addTask = (taskData: TaskFormData) => {
    const newTask: Task = {
      id: generateId(),
      title: taskData.title,
      description: taskData.description || '',
      status: 'todo',
      createdAt: new Date().toISOString(),
      dueDate: taskData.dueDate
    };

    setTasks(prev => [...prev, newTask]);
    toast.success('Tarefa criada com sucesso!');
    return newTask;
  };

  // Update a task
  const updateTask = (id: string, updatedData: Partial<Task>) => {
    setTasks(prev => 
      prev.map(task => 
        task.id === id ? { ...task, ...updatedData } : task
      )
    );
    toast.success('Tarefa atualizada com sucesso!');
  };

  // Delete a task with undo capability
  const deleteTask = (id: string) => {
    const taskToDelete = tasks.find(task => task.id === id);
    if (!taskToDelete) return;

    setDeletedTask(taskToDelete);
    setTasks(prev => prev.filter(task => task.id !== id));
    
    toast('Tarefa removida', {
      description: 'A tarefa foi removida com sucesso.',
      action: {
        label: 'Desfazer',
        onClick: () => {
          if (deletedTask) {
            setTasks(prev => [...prev, taskToDelete]);
            setDeletedTask(null);
            toast.success('Tarefa restaurada!');
          }
        }
      }
    });
  };

  // Change task status (for drag and drop)
  const changeTaskStatus = (taskId: string, newStatus: TaskStatus) => {
    setTasks(prev => 
      prev.map(task => 
        task.id === taskId ? { ...task, status: newStatus } : task
      )
    );
  };

  return {
    tasks,
    addTask,
    updateTask,
    deleteTask,
    changeTaskStatus
  };
}
