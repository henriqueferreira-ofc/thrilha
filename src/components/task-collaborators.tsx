
import { useState, useEffect } from 'react';
import { useTaskCollaborators } from '@/hooks/use-task-collaborators';
import { TaskCollaborator } from '@/types/task';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { X } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';

interface TaskCollaboratorsProps {
  taskId: string;
}

export function TaskCollaborators({ taskId }: TaskCollaboratorsProps) {
  const [collaborators, setCollaborators] = useState<TaskCollaborator[]>([]);
  const [newCollaboratorEmail, setNewCollaboratorEmail] = useState('');
  const [isOwner, setIsOwner] = useState(false);
  const { user } = useAuth();
  const { loading, addCollaborator, removeCollaborator, getTaskCollaborators, isTaskOwner } = useTaskCollaborators(user);

  useEffect(() => {
    if (taskId) {
      loadCollaborators();
      checkOwnership();
    }
  }, [taskId]);

  const loadCollaborators = async () => {
    try {
      const data = await getTaskCollaborators(taskId);
      // Convert data to match TaskCollaborator type
      const formattedCollaborators: TaskCollaborator[] = data.map(collab => ({
        id: collab.id,
        task_id: taskId,
        user_id: collab.id,
        added_at: new Date().toISOString(), // Use current date if not provided
        added_by: '', // Use empty string if not provided
        userEmail: collab.email,
        userName: collab.full_name || collab.email.split('@')[0]
      }));
      setCollaborators(formattedCollaborators);
    } catch (error) {
      console.error('Erro ao carregar colaboradores:', error);
      toast.error('Não foi possível carregar os colaboradores');
    }
  };

  const checkOwnership = async () => {
    const owner = await isTaskOwner(taskId);
    setIsOwner(owner);
  };

  const handleAddCollaborator = async () => {
    if (!newCollaboratorEmail.trim()) {
      toast.error('Por favor, insira um email válido');
      return;
    }

    try {
      const success = await addCollaborator(taskId, newCollaboratorEmail.trim());
      if (success) {
        setNewCollaboratorEmail('');
        await loadCollaborators();
      }
    } catch (error) {
      console.error('Erro ao adicionar colaborador:', error);
    }
  };

  const handleRemoveCollaborator = async (collaboratorId: string) => {
    try {
      await removeCollaborator(taskId, collaboratorId);
      await loadCollaborators();
    } catch (error) {
      console.error('Erro ao remover colaborador:', error);
    }
  };

  return (
    <div className="space-y-4">
      {isOwner && (
        <div className="flex gap-2">
          <Input
            type="email"
            placeholder="Email do colaborador"
            value={newCollaboratorEmail}
            onChange={(e) => setNewCollaboratorEmail(e.target.value)}
            className="flex-1"
          />
          <Button 
            onClick={handleAddCollaborator}
            disabled={loading}
          >
            Adicionar
          </Button>
        </div>
      )}

      <div className="space-y-2">
        {collaborators.length === 0 ? (
          <div className="text-sm text-muted-foreground">Sem colaboradores</div>
        ) : (
          collaborators.map((collaborator) => (
            <div 
              key={collaborator.id}
              className="flex items-center justify-between p-2 rounded-lg bg-black/50"
            >
              <div className="flex items-center gap-2">
                <Avatar>
                  <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${collaborator.userName || collaborator.userEmail}`} />
                  <AvatarFallback>
                    {(collaborator.userName || collaborator.userEmail || '?')[0].toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{collaborator.userName || 'Usuário'}</p>
                  <p className="text-sm text-muted-foreground">{collaborator.userEmail}</p>
                </div>
              </div>
              {isOwner && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleRemoveCollaborator(collaborator.user_id)}
                  className="h-8 w-8"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
