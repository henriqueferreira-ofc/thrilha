import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useTaskCollaborators } from '@/hooks/use-task-collaborators';
import { toast } from 'sonner';

interface TaskCollaboratorsDialogProps {
  taskId: string;
  isOpen: boolean;
  onClose: () => void;
}

export function TaskCollaboratorsDialog({ taskId, isOpen, onClose }: TaskCollaboratorsDialogProps) {
  const [email, setEmail] = useState('');
  const { collaborators, isLoading, error, loadCollaborators, addCollaborator, removeCollaborator } = useTaskCollaborators();

  useEffect(() => {
    if (isOpen) {
      loadCollaborators(taskId);
    }
  }, [isOpen, taskId, loadCollaborators]);

  const handleAddCollaborator = async () => {
    try {
      await addCollaborator(taskId, email);
      setEmail('');
    } catch (err) {
      console.error('Erro ao adicionar colaborador:', err);
    }
  };

  const handleRemoveCollaborator = async (userId: string) => {
    try {
      await removeCollaborator(taskId, userId);
    } catch (err) {
      console.error('Erro ao remover colaborador:', err);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Gerenciar Colaboradores</DialogTitle>
          <DialogDescription>
            Adicione ou remova colaboradores desta tarefa. Colaboradores podem visualizar e editar a tarefa.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex gap-2">
            <Input
              type="email"
              placeholder="Email do colaborador"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <Button onClick={handleAddCollaborator} disabled={isLoading}>
              Adicionar
            </Button>
          </div>

          {error && (
            <div className="text-red-500 text-sm">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <h3 className="font-medium">Colaboradores</h3>
            {isLoading ? (
              <div>Carregando...</div>
            ) : collaborators.length === 0 ? (
              <div className="text-sm text-gray-500">Nenhum colaborador adicionado</div>
            ) : (
              <div className="space-y-2">
                {collaborators.map((collaborator) => (
                  <div key={collaborator.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Avatar>
                        <AvatarImage src={collaborator.avatar_url || undefined} />
                        <AvatarFallback>
                          {collaborator.email.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">{collaborator.full_name || collaborator.email}</div>
                        <div className="text-sm text-gray-500">{collaborator.email}</div>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveCollaborator(collaborator.id)}
                    >
                      Remover
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 