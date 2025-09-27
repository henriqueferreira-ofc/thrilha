
import React from 'react';
import { TaskBoard } from '@/components/task-board';
import { SidebarProvider } from '@/components/ui/sidebar';
import { TaskSidebar } from '@/components/task-sidebar';
import { useTasks } from '@/hooks/use-tasks';

const Dashboard = () => {
  const { tasks, updateTask, deleteTask, changeTaskStatus } = useTasks();

  return (
    <SidebarProvider>
      <div className="page-wrapper">
        <TaskSidebar />
        
        <div className="flex-1 flex flex-col">
          <header className="page-header">
            <div className="flex flex-col gap-2 w-full">
              <h1 className="text-xl font-bold">Dashboard</h1>
            </div>
          </header>
          
          <main className="page-main overflow-hidden">
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
