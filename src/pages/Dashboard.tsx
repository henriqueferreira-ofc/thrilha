
import React from 'react';
import { TaskBoard } from '@/components/task-board';
import { SidebarProvider } from '@/components/ui/sidebar';
import { TaskSidebar } from '@/components/task-sidebar';
import { useTasks } from '@/hooks/use-tasks';

const Dashboard = () => {
  const { tasks, updateTask, deleteTask, changeTaskStatus } = useTasks();

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <TaskSidebar />
        
        <div className="flex-1 flex flex-col">
          <header className="p-6 flex justify-between items-center border-b border-white/10">
            <h1 className="text-xl font-bold">Dashboard</h1>
          </header>
          
          <main className="flex-1 p-6">
            <TaskBoard 
              tasks={tasks || []}
              onDelete={deleteTask}
              onUpdate={updateTask}
              onChangeStatus={changeTaskStatus}
            />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default Dashboard;
