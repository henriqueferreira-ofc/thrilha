
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { supabase } from '@/supabase/client';
import { useAuth } from '@/context/AuthContext';

interface BirthdayFormProps {
  onClose: () => void;
  onSuccess?: () => void;
  initialData?: {
    id?: string;
    name?: string;
    birthdate?: string;
    relationship?: string;
    notes?: string;
  };
}

export default function BirthdayForm({ onClose, onSuccess, initialData }: BirthdayFormProps) {
  const [name, setName] = useState(initialData?.name || '');
  const [birthdate, setBirthdate] = useState(initialData?.birthdate ? initialData.birthdate.split('T')[0] : '');
  const [relationship, setRelationship] = useState(initialData?.relationship || '');
  const [notes, setNotes] = useState(initialData?.notes || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuth();

  // Atualizar o formulário se os dados iniciais mudarem
  useEffect(() => {
    if (initialData) {
      setName(initialData.name || '');
      // Garantir que estamos usando apenas a data sem a parte do tempo
      setBirthdate(initialData.birthdate ? initialData.birthdate.split('T')[0] : '');
      setRelationship(initialData.relationship || '');
      setNotes(initialData.notes || '');
    }
  }, [initialData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast.error("Você precisa estar logado para adicionar um aniversário.");
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Garantimos que estamos enviando apenas a data sem timezone
      const birthdateToSave = birthdate;
      
      if (initialData?.id) {
        // Atualizar um registro existente
        const { error } = await supabase
          .from('birthdays')
          .update({
            name,
            birthdate: birthdateToSave,
            relationship,
            notes: notes || null,
            updated_at: new Date().toISOString()
          })
          .eq('id', initialData.id);
        
        if (error) {
          throw error;
        }
        
        toast.success("Aniversário atualizado", {
          description: `Aniversário de ${name} foi atualizado com sucesso.`,
        });
      } else {
        // Inserir um novo registro
        const { data, error } = await supabase
          .from('birthdays')
          .insert({
            user_id: user.id,
            name,
            birthdate: birthdateToSave,
            relationship,
            notes: notes || null
          })
          .select();
        
        if (error) {
          throw error;
        }
        
        toast.success("Aniversário adicionado", {
          description: `Aniversário de ${name} foi adicionado com sucesso.`,
        });
      }
      
      // Reset form
      setName('');
      setBirthdate('');
      setRelationship('');
      setNotes('');
      
      // Callback para atualizar lista
      if (onSuccess) {
        onSuccess();
      }
      
      onClose();
    } catch (error: any) {
      console.error('Erro ao salvar aniversário:', error);
      toast.error("Erro ao salvar", {
        description: error.message || "Não foi possível salvar o aniversário. Tente novamente."
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-2">
        <Label htmlFor="name">Nome</Label>
        <Input 
          id="name" 
          value={name} 
          onChange={(e) => setName(e.target.value)} 
          required 
        />
      </div>
      
      <div className="grid gap-2">
        <Label htmlFor="birthdate">Data de Nascimento</Label>
        <Input 
          id="birthdate" 
          type="date" 
          value={birthdate} 
          onChange={(e) => setBirthdate(e.target.value)} 
          required 
        />
      </div>
      
      <div className="grid gap-2">
        <Label htmlFor="relationship">Relação</Label>
        <Input 
          id="relationship" 
          value={relationship} 
          onChange={(e) => setRelationship(e.target.value)} 
          placeholder="Ex: Familiar, Amigo, Colega" 
          required 
        />
      </div>
      
      <div className="grid gap-2">
        <Label htmlFor="notes">Observações (opcional)</Label>
        <Textarea 
          id="notes" 
          value={notes} 
          onChange={(e) => setNotes(e.target.value)} 
          placeholder="Adicione observações importantes como: presentes preferidos, etc." 
          rows={3} 
        />
      </div>
      
      <div className="flex justify-end gap-2 pt-2">
        <Button 
          type="button" 
          variant="outline" 
          onClick={onClose}
          disabled={isSubmitting}
        >
          Cancelar
        </Button>
        <Button 
          type="submit" 
          disabled={isSubmitting || !name || !birthdate || !relationship}
        >
          {isSubmitting ? "Salvando..." : initialData?.id ? "Atualizar" : "Salvar"}
        </Button>
      </div>
    </form>
  );
}
