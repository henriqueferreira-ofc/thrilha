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
  const [collaborators, setCollaborators] = useState<Array<{ id: string; email: string; avatar_url: string | null; full_name: string | null }>>([]);
  const { loading, addCollaborator, removeCollaborator, getTaskCollaborators, isTaskOwner } = useTaskCollaborators();
  const [isOwner, setIsOwner] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadCollaborators();
      checkOwnership();
    }
  }, [isOpen, taskId]);

  const loadCollaborators = async () => {
<<<<<<< HEAD
    const data = await getTaskCollaborators(taskId);
    setCollaborators(data);
  };

  const checkOwnership = async () => {
    const owner = await isTaskOwner(taskId);
    setIsOwner(owner);
=======
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
>>>>>>> 0a88ce11de48e33ae54fa645d23a44fda7ebce21
  };

  const handleAddCollaborator = async () => {
    if (!email) {
      toast.error('Por favor, insira um email válido');
      return;
    }

<<<<<<< HEAD
    const success = await addCollaborator(taskId, email);
    if (success) {
      setEmail('');
      await loadCollaborators();
=======
    try {
      setIsLoading(true);
      const success = await addCollaborator(taskId, email.trim());
      if (success) {
        setEmail('');
        await loadCollaborators();
      }
    } catch (err) {
      console.error('Erro ao adicionar colaborador:', err);
      setError('Falha ao adicionar colaborador');
    } finally {
      setIsLoading(false);
>>>>>>> 0a88ce11de48e33ae54fa645d23a44fda7ebce21
    }
  };

  const handleRemoveCollaborator = async (userId: string) => {
    const success = await removeCollaborator(taskId, userId);
    if (success) {
      await loadCollaborators();
<<<<<<< HEAD
=======
    } catch (err) {
      console.error('Erro ao remover colaborador:', err);
      setError('Falha ao remover colaborador');
    } finally {
      setIsLoading(false);
>>>>>>> 0a88ce11de48e33ae54fa645d23a44fda7ebce21
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
          {isOwner && (
            <div className="flex gap-2">
              <Input
                type="email"
                placeholder="Email do colaborador"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
              />
              <Button onClick={handleAddCollaborator} disabled={loading}>
                Adicionar
              </Button>
            </div>
          )}

          <div className="space-y-2">
            <h3 className="font-medium">Colaboradores</h3>
            {loading ? (
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
                    {isOwner && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveCollaborator(collaborator.id)}
                        disabled={loading}
                      >
                        Remover
                      </Button>
                    )}
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
