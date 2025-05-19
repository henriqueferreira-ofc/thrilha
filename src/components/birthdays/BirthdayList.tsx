
import { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { toast } from 'sonner';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Trash2, Edit } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { supabase } from '@/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle, 
  AlertDialogTrigger 
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import BirthdayForm from './BirthdayForm';

interface Birthday {
  id: string;
  name: string;
  birthdate: string;
  relationship: string;
  notes?: string;
}

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
    // Formatar a data para o formato esperado pelo input type="date" (YYYY-MM-DD)
    const formattedBirthday = {
      ...birthday,
      birthdate: birthday.birthdate.split('T')[0], // Remove a parte de tempo se existir
    };
    
    setEditingBirthday(formattedBirthday);
    setIsEditDialogOpen(true);
  };

  const formatBirthdate = (dateString: string) => {
    try {
      // Tenta fazer o parse da data (podendo estar em formato ISO ou apenas data)
      const date = dateString.includes('T') 
        ? parseISO(dateString) 
        : new Date(dateString);
      
      return format(date, "dd 'de' MMMM", { locale: ptBR });
    } catch (error) {
      console.error("Error formatting date:", error);
      return dateString;
    }
  };

  const calculateDaysUntilBirthday = (birthdateStr: string) => {
    const today = new Date();
    
    // Tenta fazer o parse da data (podendo estar em formato ISO ou apenas data)
    const birthdate = birthdateStr.includes('T') 
      ? parseISO(birthdateStr) 
      : new Date(birthdateStr);
    
    const birthdateThisYear = new Date(
      today.getFullYear(),
      birthdate.getMonth(),
      birthdate.getDate()
    );
    
    if (birthdateThisYear < today) {
      // Birthday already passed this year, calculate for next year
      birthdateThisYear.setFullYear(today.getFullYear() + 1);
    }
    
    const diffTime = birthdateThisYear.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
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
        <div className="text-center py-8 text-gray-400">
          <p>Nenhum aniversário cadastrado ainda.</p>
        </div>
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
                <TableRow key={birthday.id}>
                  <TableCell className="font-medium">{birthday.name}</TableCell>
                  <TableCell>{formatBirthdate(birthday.birthdate)}</TableCell>
                  <TableCell>{birthday.relationship}</TableCell>
                  <TableCell>
                    <span className={daysUntil <= 7 ? "text-red-400 font-bold" : ""}>
                      {daysUntil} dias
                    </span>
                  </TableCell>
                  <TableCell>{birthday.notes || "-"}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button 
                        variant="outline" 
                        size="icon"
                        onClick={() => handleEdit(birthday)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="destructive" size="icon">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Excluir Aniversário</AlertDialogTitle>
                            <AlertDialogDescription>
                              Tem certeza que deseja excluir o aniversário de {birthday.name}? 
                              Esta ação não pode ser desfeita.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction 
                              onClick={() => deleteBirthday(birthday.id)}
                              className="bg-red-500 hover:bg-red-600"
                            >
                              Excluir
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
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
