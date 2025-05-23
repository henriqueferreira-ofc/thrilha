
export function calculateDaysUntilBirthday(birthdateStr: string): number {
  // Cria uma data com a hora atual (para hoje)
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  // Extrai apenas a parte da data (YYYY-MM-DD) se estiver no formato ISO
  const dateOnly = birthdateStr.split('T')[0];
  
  // Cria um objeto Date a partir da string sem horário
  const birthdate = new Date(dateOnly);
  
  // Cria uma data para o aniversário deste ano
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
