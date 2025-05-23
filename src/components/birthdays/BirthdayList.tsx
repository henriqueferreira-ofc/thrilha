
import { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { toast } from 'sonner';
import { 
  Table, 
  TableBody, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { supabase } from '@/supabase/client';
import { useAuth } from '@/context/AuthContext';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import BirthdayForm from './BirthdayForm';
import { Birthday } from './types';
import { BirthdayEmptyState } from './BirthdayEmptyState';
import { BirthdayTableItem } from './BirthdayTableItem';
import { calculateDaysUntilBirthday } from './utils';

interface BirthdayListRef {
  fetchBirthdays: () => Promise<void>;
}

const BirthdayList = forwardRef<BirthdayListRef>((props, ref) => {
  const [birthdays, setBirthdays] = useState<Birthday[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingBirthday, setEditingBirthday] = useState<Birthday | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const { user } = useAuth();

  // Função para buscar aniversários
  const fetchBirthdays = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('birthdays')
        .select('*')
        .order('birthdate', { ascending: true });
      
      if (error) {
        throw error;
      }
      
      setBirthdays(data || []);
    } catch (error: any) {
      console.error('Erro ao buscar aniversários:', error);
      toast.error('Erro ao carregar aniversários');
    } finally {
      setLoading(false);
    }
  };

  // Expor a função fetchBirthdays via ref
  useImperativeHandle(ref, () => ({
    fetchBirthdays
  }));

  // Carregar aniversários quando o componente montar
  useEffect(() => {
    fetchBirthdays();
  }, [user]);

  // Função para excluir aniversário
  const deleteBirthday = async (id: string) => {
    try {
      const { error } = await supabase
        .from('birthdays')
        .delete()
        .eq('id', id);
      
      if (error) {
        throw error;
      }
      
      // Atualiza a lista local removendo o item excluído
      setBirthdays(birthdays.filter(birthday => birthday.id !== id));
      
      toast.success("Aniversário excluído", {
        description: "O aniversário foi removido com sucesso.",
      });
    } catch (error: any) {
      console.error('Erro ao excluir aniversário:', error);
      toast.error("Erro ao excluir", {
        description: error.message || "Não foi possível excluir o aniversário. Tente novamente."
      });
    }
  };

  // Função para iniciar a edição de um aniversário
  const handleEdit = (birthday: Birthday) => {
    // Garantir que estamos usando apenas a parte da data
    const formattedBirthday = {
      ...birthday,
      birthdate: birthday.birthdate.split('T')[0], // Remove a parte de tempo se existir
    };
    
    setEditingBirthday(formattedBirthday);
    setIsEditDialogOpen(true);
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-purple-500 border-r-transparent align-[-0.125em]"></div>
        <p className="mt-2 text-gray-400">Carregando aniversários...</p>
      </div>
    );
  }

  return (
    <div>
      {birthdays.length === 0 ? (
        <BirthdayEmptyState />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Data</TableHead>
              <TableHead>Relação</TableHead>
              <TableHead>Dias Restantes</TableHead>
              <TableHead>Observações</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {birthdays.map((birthday) => {
              const daysUntil = calculateDaysUntilBirthday(birthday.birthdate);
              
              return (
                <BirthdayTableItem
                  key={birthday.id}
                  birthday={birthday}
                  daysUntil={daysUntil}
                  onEdit={handleEdit}
                  onDelete={deleteBirthday}
                />
              );
            })}
          </TableBody>
        </Table>
      )}

      {/* Diálogo de edição */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Editar Aniversário</DialogTitle>
          </DialogHeader>
          <BirthdayForm
            initialData={editingBirthday || undefined}
            onClose={() => setIsEditDialogOpen(false)}
            onSuccess={fetchBirthdays}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
});

BirthdayList.displayName = 'BirthdayList';

export default BirthdayList;
