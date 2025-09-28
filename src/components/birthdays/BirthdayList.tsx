
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
import { Button } from '@/components/ui/button';
import { Edit2Icon, Trash2Icon } from 'lucide-react';
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
import { calculateDaysUntilBirthday, formatBirthdayDate, getDaysRemainingInfo, getRelationshipInfo } from './utils';
import { DeleteConfirmationDialog } from './DeleteConfirmationDialog';

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
        <>
          <div className="space-y-4 md:hidden">
            {birthdays.map((birthday) => {
              const daysUntil = calculateDaysUntilBirthday(birthday.birthdate);
              const formattedBirthdate = formatBirthdayDate(birthday.birthdate);
              const relationshipInfo = getRelationshipInfo(birthday.relationship);
              const daysInfo = getDaysRemainingInfo(daysUntil);

              return (
                <BirthdayMobileItem
                  key={birthday.id}
                  birthday={birthday}
                  formattedBirthdate={formattedBirthdate}
                  relationshipInfo={relationshipInfo}
                  daysInfo={daysInfo}
                  onEdit={() => handleEdit(birthday)}
                  onDelete={() => deleteBirthday(birthday.id)}
                />
              );
            })}
          </div>

          <div className="overflow-x-auto w-full hidden md:block">
          <Table className="min-w-full">
          <TableHeader>
            <TableRow>
              <TableHead className="min-w-[180px]">Nome</TableHead>
              <TableHead className="min-w-[160px]">Data</TableHead>
              <TableHead className="min-w-[140px]">Relação</TableHead>
              <TableHead className="min-w-[140px]">Dias Restantes</TableHead>
              <TableHead className="min-w-[200px]">Observações</TableHead>
              <TableHead className="text-right min-w-[110px]">Ações</TableHead>
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
          </div>
        </>
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

interface BirthdayMobileItemProps {
  birthday: Birthday;
  formattedBirthdate: string;
  relationshipInfo: ReturnType<typeof getRelationshipInfo>;
  daysInfo: ReturnType<typeof getDaysRemainingInfo>;
  onEdit: () => void;
  onDelete: () => void;
}

const BirthdayMobileItem = ({
  birthday,
  formattedBirthdate,
  relationshipInfo,
  daysInfo,
  onEdit,
  onDelete
}: BirthdayMobileItemProps) => {
  return (
    <div className="rounded-xl border border-white/10 bg-black/50 p-4 shadow-sm shadow-purple-500/10 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1 min-w-0">
          <h3 className="text-base font-semibold text-white break-words">{birthday.name}</h3>
          <p className="text-sm text-zinc-400 break-words">{formattedBirthdate}</p>
        </div>
        <span className={`text-sm ${daysInfo.className ?? ''}`}>{daysInfo.label}</span>
      </div>
      <div className="text-sm text-zinc-200">
        <span className="font-medium text-white">Relação: </span>
        <span className={relationshipInfo.className}>{relationshipInfo.label}</span>
      </div>
      <div className="text-sm text-zinc-200 break-words">
        <span className="font-medium text-white">Observações: </span>
        {birthday.notes || '-'}
      </div>
      <div className="flex justify-end gap-2">
        <Button
          size="sm"
          variant="ghost"
          onClick={onEdit}
          className="h-8 w-8 p-0 text-purple-400 hover:text-purple-300 hover:bg-purple-900/40"
        >
          <Edit2Icon className="h-4 w-4" />
        </Button>
        <DeleteConfirmationDialog
          itemName={birthday.name}
          itemLabel="aniversário"
          onDelete={onDelete}
          trigger={
            <Button
              size="sm"
              variant="ghost"
              className="h-8 w-8 p-0 text-red-400 hover:text-red-300 hover:bg-red-900/40"
            >
              <Trash2Icon className="h-4 w-4" />
            </Button>
          }
        />
      </div>
    </div>
  );
};

BirthdayList.displayName = 'BirthdayList';

export default BirthdayList;
