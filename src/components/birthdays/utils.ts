
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export function calculateDaysUntilBirthday(birthdateStr: string): number {
  // Cria uma data com a hora atual (para hoje)
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  // Certifica-se de extrair apenas a data (YYYY-MM-DD) e trabalhar com isso
  let dateOnly = birthdateStr;
  
  // Se estiver no formato ISO, extrai apenas a parte da data
  if (birthdateStr.includes('T')) {
    dateOnly = birthdateStr.split('T')[0];
  }
  
  // Cria a data de aniversário sem considerar o fuso horário
  // Pega o dia, mês e ano separados para evitar problemas de timezone
  const parts = dateOnly.split('-');
  const year = parseInt(parts[0]);
  const month = parseInt(parts[1]) - 1; // mês em JS começa em 0
  const day = parseInt(parts[2]);
  
  // Garante que a data é criada exatamente como está no banco de dados
  const birthdate = new Date(year, month, day);
  
  // Cria uma data para o aniversário deste ano, usando o mesmo dia e mês
  // mas com o ano atual
  const birthdateThisYear = new Date(
    today.getFullYear(),
    birthdate.getMonth(),
    birthdate.getDate()
  );
  
  // Se o aniversário já passou este ano, calculamos para o próximo ano
  if (birthdateThisYear < today) {
    birthdateThisYear.setFullYear(today.getFullYear() + 1);
  }
  
  // Calcula a diferença em dias
  const diffTime = birthdateThisYear.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

export function formatBirthdayDate(dateStr: string): string {
  try {
    let dateOnly = dateStr;
    if (dateStr.includes('T')) {
      dateOnly = dateStr.split('T')[0];
    }

    const [year, month, day] = dateOnly.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    return format(date, "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
  } catch (error) {
    console.error('Erro ao formatar data:', error);
    return dateStr;
  }
}

interface LabelInfo {
  label: string;
  className?: string;
}

export function getRelationshipInfo(relationship: string): LabelInfo {
  const normalized = relationship?.trim().toLowerCase();

  if (!normalized) {
    return { label: '-' };
  }

  if (['familiar', 'família', 'familia'].includes(normalized)) {
    return { label: 'Familiar', className: 'text-purple-400' };
  }

  if (['amigo', 'amiga', 'amigos'].includes(normalized)) {
    return { label: 'Amigo(a)', className: 'text-blue-400' };
  }

  if (['colega', 'colegas', 'trabalho', 'parceiro'].includes(normalized)) {
    return { label: 'Colega', className: 'text-cyan-400' };
  }

  return { label: relationship };
}

export function getDaysRemainingInfo(daysUntil: number): LabelInfo {
  if (daysUntil === 0) {
    return { label: 'Hoje!', className: 'text-green-500 font-bold' };
  }

  if (daysUntil === 1) {
    return { label: 'Amanhã', className: 'text-yellow-500' };
  }

  if (daysUntil <= 7) {
    return { label: `${daysUntil} dias`, className: 'text-yellow-500' };
  }

  return { label: `${daysUntil} dias` };
}
