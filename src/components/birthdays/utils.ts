
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
