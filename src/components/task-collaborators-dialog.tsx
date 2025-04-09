
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useTaskCollaborators } from '@/hooks/use-task-collaborators';
import { toast } from 'sonner';
import { TaskCollaborator } from '@/types/task';

interface TaskCollaboratorsDialogProps {
  taskId: string;
  isOpen: boolean;
  onClose: () => void;
}

export function TaskCollaboratorsDialog({ taskId, isOpen, onClose }: TaskCollaboratorsDialogProps) {
  const [email, setEmail] = useState('');
  const [collaborators, setCollaborators] = useState<TaskCollaborator[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { loading, addCollaborator, removeCollaborator, getTaskCollaborators } = useTaskCollaborators();

  useEffect(() => {
    if (isOpen && taskId) {
      loadCollaborators();
    }
  }, [isOpen, taskId]);

  const loadCollaborators = async () => {
    if (!taskId) return;
    setIsLoading(true);
    try {
      const data = await getTaskCollaborators(taskId);
      setCollaborators(data || []);
      setError(null);
    } catch (err) {
      console.error('Erro ao carregar colaboradores:', err);
      setError('Falha ao carregar colaboradores');
      setCollaborators([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddCollaborator = async () => {
    if (!email.trim()) {
      toast.error('Por favor, insira um email válido');
      return;
    }

    try {
      setIsLoading(true);
      const success = await addCollaborator(taskId, email.trim());
      if (success) {
        setEmail('');
        await loadCollaborators();
        toast.success('Colaborador adicionado com sucesso');
      }
    } catch (err) {
      console.error('Erro ao adicionar colaborador:', err);
      setError('Falha ao adicionar colaborador');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveCollaborator = async (userId: string) => {
    try {
      setIsLoading(true);
      await removeCollaborator(taskId, userId);
      await loadCollaborators();
      toast.success('Colaborador removido com sucesso');
    } catch (err) {
      console.error('Erro ao remover colaborador:', err);
      setError('Falha ao remover colaborador');
    } finally {
      setIsLoading(false);
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
            <Button onClick={handleAddCollaborator} disabled={loading || isLoading}>
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
            ) : collaborators && collaborators.length === 0 ? (
              <div className="text-sm text-gray-500">Nenhum colaborador adicionado</div>
            ) : (
              <div className="space-y-2">
                {collaborators && collaborators.map((collaborator) => (
                  <div key={collaborator.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Avatar>
                        <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${collaborator.userName || collaborator.userEmail}`} />
                        <AvatarFallback>
                          {(collaborator.userName || collaborator.userEmail || '?')[0].toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">{collaborator.userName || collaborator.userEmail}</div>
                        <div className="text-sm text-gray-500">{collaborator.userEmail}</div>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveCollaborator(collaborator.user_id)}
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
