
export type TaskStatus = "todo" | "inProgress" | "done";

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  createdAt: string;
  dueDate?: string;
}

export interface Column {
  id: TaskStatus;
  title: string;
  tasks: Task[];
}

export interface TaskFormData {
  title: string;
  description?: string;
  dueDate?: string;
}

export interface TaskCollaborator {
  id: string;
  task_id: string;
  user_id: string;
  added_at: string;
  added_by: string;
  userEmail?: string; // Campo adicional para exibição
  userName?: string;  // Campo adicional para exibição
}
