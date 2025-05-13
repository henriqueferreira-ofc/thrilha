
export interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  created_at: string;
  updated_at: string;
  user_id: string;
  due_date?: string;
  board_id: string; // Adicionando board_id ao tipo Task
}

export type TaskStatus = 'todo' | 'in-progress' | 'done';

export interface TaskFormProps {
  initialData?: Partial<Task>;
  onSubmit: (data: Omit<Task, 'id' | 'created_at' | 'updated_at' | 'user_id'>) => void;
  onCancel?: () => void;
  loading?: boolean;
}

export interface TaskFilterOptions {
  status?: TaskStatus;
  search?: string;
  sort?: 'newest' | 'oldest' | 'title';
}

export interface TaskOperations {
  createTask: (task: Omit<Task, 'id' | 'created_at' | 'updated_at' | 'user_id'>) => Promise<void>;
  updateTask: (id: string, data: Partial<Omit<Task, 'id' | 'created_at' | 'updated_at' | 'user_id'>>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  completeTask: (id: string) => Promise<void>;
  moveTask: (id: string, status: TaskStatus) => Promise<void>;
}

export interface TaskState {
  tasks: Task[];
  loading: boolean;
  error: string | null;
  filter: TaskFilterOptions;
}

export interface TaskContextType extends TaskState, TaskOperations {
  setFilter: (filter: TaskFilterOptions) => void;
  filteredTasks: Task[];
}
