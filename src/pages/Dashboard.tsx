
import { TaskSidebar } from '@/components/task-sidebar';
import { TaskBoard } from '@/components/task-board';
import { RequireAuth } from '@/components/RequireAuth';
import { useBoards } from '@/hooks/use-boards';
import { useTasksBoard } from '@/hooks/use-tasks-board';
import { useTaskOperationsBoard } from '@/hooks/tasks/use-task-operations-board';
import { BoardSelector } from '@/components/boards/board-selector';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ExclamationTriangleIcon } from '@radix-ui/react-icons';

export function Dashboard() {
  const { 
    boards, 
    loading: loadingBoards, 
    currentBoard, 
    setCurrentBoard,
    canCreateMoreBoards,
    createBoard
  } = useBoards();
  
  const { 
    tasks, 
    loading: loadingTasks, 
    setTasks 
  } = useTasksBoard(currentBoard);
  
  const { 
    addTask, 
    updateTask, 
    deleteTask, 
    changeTaskStatus 
  } = useTaskOperationsBoard(tasks, setTasks, currentBoard);

  return (
    <RequireAuth>
      <div className="flex h-screen overflow-hidden">
        <TaskSidebar onCreateTask={addTask} />
        <main className="flex-1 flex flex-col overflow-hidden">
          <div className="p-4 border-b border-white/10">
            {loadingBoards ? (
              <Skeleton className="h-10 w-[250px]" />
            ) : (
              <BoardSelector
                boards={boards}
                currentBoard={currentBoard}
                onBoardChange={setCurrentBoard}
                canCreateMoreBoards={canCreateMoreBoards}
                onCreateBoard={createBoard}
              />
            )}
          </div>
          
          <div className="flex-1 overflow-auto">
            {!currentBoard && !loadingBoards ? (
              <div className="flex flex-col items-center justify-center h-full p-6">
                <Alert className="max-w-md">
                  <ExclamationTriangleIcon className="h-4 w-4" />
                  <AlertDescription>
                    Você precisa criar um quadro para começar a adicionar tarefas.
                    Use o botão + ao lado do seletor de quadros.
                  </AlertDescription>
                </Alert>
              </div>
            ) : loadingBoards || loadingTasks ? (
              <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
                <Skeleton className="h-[500px]" />
                <Skeleton className="h-[500px]" />
                <Skeleton className="h-[500px]" />
              </div>
            ) : (
              <TaskBoard
                tasks={tasks}
                onDelete={deleteTask}
                onUpdate={updateTask}
                onChangeStatus={changeTaskStatus}
              />
            )}
          </div>
        </main>
      </div>
    </RequireAuth>
  );
}
