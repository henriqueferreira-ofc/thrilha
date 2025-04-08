
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { TaskCollaborator } from '@/types/task';
import { useTasks } from '@/hooks/use-tasks';
import { UserPlus, X, Users } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { toast } from 'sonner';
import { ScrollArea } from '@/components/ui/scroll-area';

interface TaskCollaboratorsProps {
  taskId: string;
}

export function TaskCollaborators({ taskId }: TaskCollaboratorsProps) {
  const [email, setEmail] = useState('');
  const [collaborators, setCollaborators] = useState<TaskCollaborator[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const { addCollaborator, removeCollaborator, getTaskCollaborators, isTaskOwner } = useTasks();

  // Carregar colaboradores e verificar se é dono da tarefa
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const taskCollaborators = await getTaskCollaborators(taskId);
        setCollaborators(taskCollaborators);
        
        const owner = await isTaskOwner(taskId);
        setIsOwner(owner);
      } catch (error) {
        console.error('Erro ao carregar dados:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, [taskId, getTaskCollaborators, isTaskOwner]);

  const handleAddCollaborator = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      toast.error('Por favor, informe um email válido');
      return;
    }
    
    setLoading(true);
    try {
      const success = await addCollaborator(taskId, email);
      if (success) {
        setEmail('');
        // Recarregar a lista de colaboradores
        const updatedCollaborators = await getTaskCollaborators(taskId);
        setCollaborators(updatedCollaborators);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveCollaborator = async (collaboratorId: string) => {
    setLoading(true);
    try {
      const success = await removeCollaborator(collaboratorId);
      if (success) {
        // Atualizar a lista removendo o colaborador
        setCollaborators(prev => prev.filter(c => c.id !== collaboratorId));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium flex items-center gap-2">
        <Users size={18} />
        Colaboradores
      </h3>
      
      {isOwner && (
        <form onSubmit={handleAddCollaborator} className="flex gap-2">
          <Input
            type="email"
            placeholder="Email do colaborador"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
            className="flex-1"
          />
          <Button type="submit" size="sm" disabled={loading} className="bg-purple-600 hover:bg-purple-700">
            <UserPlus className="h-4 w-4 mr-2" />
            Adicionar
          </Button>
        </form>
      )}

      <ScrollArea className="h-48 rounded-md border border-white/10 p-2">
        {loading && <div className="text-center py-4 text-sm">Carregando...</div>}
        
        {!loading && collaborators.length === 0 && (
          <div className="text-center py-4 text-sm text-muted-foreground">
            Nenhum colaborador adicionado
          </div>
        )}
        
        {!loading && collaborators.length > 0 && (
          <ul className="space-y-2">
            {collaborators.map((collab) => (
              <li key={collab.id} className="flex items-center justify-between p-2 rounded-lg bg-black/30">
                <div className="flex items-center gap-2">
                  <Avatar className="h-8 w-8 bg-purple-500/20 border border-purple-500/30">
                    <AvatarFallback>{collab.userName?.[0] || '?'}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium">{collab.userName || 'Usuário'}</p>
                    <p className="text-xs text-muted-foreground">{collab.userEmail}</p>
                  </div>
                </div>
                
                {isOwner && (
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={() => handleRemoveCollaborator(collab.id)}
                    className="h-8 w-8 text-red-500 hover:text-red-400 hover:bg-red-500/10"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </li>
            ))}
          </ul>
        )}
      </ScrollArea>
    </div>
  );
}
