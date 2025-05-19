
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

interface BirthdayFormProps {
  onClose: () => void;
}

export default function BirthdayForm({ onClose }: BirthdayFormProps) {
  const [name, setName] = useState('');
  const [birthdate, setBirthdate] = useState('');
  const [relationship, setRelationship] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate saving
    setTimeout(() => {
      toast("Aniversário adicionado", {
        description: `Aniversário de ${name} foi adicionado com sucesso.`,
      });
      setIsSubmitting(false);
      onClose();
    }, 500);
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
          {isSubmitting ? "Salvando..." : "Salvar"}
        </Button>
      </div>
    </form>
  );
}
