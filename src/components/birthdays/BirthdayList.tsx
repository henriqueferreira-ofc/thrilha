
import { useState, useEffect } from 'react';
import { useToast } from '@/components/ui/use-toast';
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
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Birthday {
  id: string;
  name: string;
  birthdate: string;
  relationship: string;
  notes?: string;
}

const SAMPLE_BIRTHDAYS: Birthday[] = [
  {
    id: '1',
    name: 'Maria Silva',
    birthdate: '1980-05-12',
    relationship: 'Mãe',
    notes: 'Gosta de chocolates',
  },
  {
    id: '2',
    name: 'João Oliveira',
    birthdate: '1975-08-23',
    relationship: 'Pai',
  },
  {
    id: '3',
    name: 'Ana Costa',
    birthdate: '1990-11-03',
    relationship: 'Irmã',
    notes: 'Prefere presentes feitos à mão',
  }
];

export default function BirthdayList() {
  const [birthdays, setBirthdays] = useState<Birthday[]>(SAMPLE_BIRTHDAYS);
  const { toast } = useToast();

  const deleteBirthday = (id: string) => {
    setBirthdays(birthdays.filter(birthday => birthday.id !== id));
    toast({
      title: "Aniversário excluído",
      description: "O aniversário foi removido com sucesso.",
    });
  };

  const formatBirthdate = (dateString: string) => {
    try {
      return format(new Date(dateString), "dd 'de' MMMM", { locale: ptBR });
    } catch (error) {
      console.error("Error formatting date:", error);
      return dateString;
    }
  };

  const calculateDaysUntilBirthday = (birthdateStr: string) => {
    const today = new Date();
    const birthdate = new Date(birthdateStr);
    
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
                      <Button variant="outline" size="icon">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="destructive" 
                        size="icon" 
                        onClick={() => deleteBirthday(birthday.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
