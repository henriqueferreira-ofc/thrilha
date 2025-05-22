
import { TaskStatus } from '@/types/task';
import { CheckIcon, CircleDashed } from 'lucide-react';

interface StatusIndicatorProps {
  status: TaskStatus;
}

export function StatusIndicator({ status }: StatusIndicatorProps) {
  if (status === 'done') {
    return (
      <div className="w-6 h-6 flex items-center justify-center rounded-full bg-purple-600 text-white">
        <CheckIcon className="h-4 w-4" />
      </div>
    );
  }

  return (
    <div className="w-6 h-6 flex items-center justify-center rounded-full border border-zinc-400 text-zinc-400">
      <CircleDashed className="h-4 w-4" />
    </div>
  );
}
