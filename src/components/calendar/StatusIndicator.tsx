
import { Circle, Check } from 'lucide-react';
import { Task } from '@/types/task';

interface StatusIndicatorProps {
  status: Task['status'];
}

export const StatusIndicator = ({ status }: StatusIndicatorProps) => {
  switch (status) {
    case 'todo':
      return <Circle className="h-4 w-4 text-muted-foreground" />;
    case 'in-progress':
      return <Circle className="h-4 w-4 text-blue-500 fill-blue-500/30" />;
    case 'done':
      return <Check className="h-4 w-4 text-green-500" />;
    default:
      return null;
  }
};
