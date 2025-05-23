
// Lista de alguns feriados nacionais brasileiros e datas comemorativas
export function getHolidaysForMonth(year: number, month: number): {date: Date, name: string}[] {
  const allHolidays = getAllHolidays(year);
  return allHolidays.filter(holiday => 
    holiday.date.getMonth() + 1 === month
  );
}

// Função para obter todos os feriados do ano
export function getAllHolidays(year: number): {date: Date, name: string}[] {
  // Lista de feriados fixos (mês, dia, nome)
  const fixedHolidays = [
    { month: 1, day: 1, name: 'Confraternização Universal' },
    { month: 4, day: 21, name: 'Tiradentes' },
    { month: 5, day: 1, name: 'Dia do Trabalho' },
    { month: 9, day: 7, name: 'Independência do Brasil' },
    { month: 10, day: 12, name: 'Nossa Senhora Aparecida' },
    { month: 11, day: 2, name: 'Finados' },
    { month: 11, day: 15, name: 'Proclamação da República' },
    { month: 12, day: 25, name: 'Natal' },
  ];
  
  // Datas comemorativas
  const commemorativeDates = [
    { month: 1, day: 30, name: 'Dia da Saudade' },
    { month: 2, day: 2, name: 'Dia do Agente Fiscal' },
    { month: 3, day: 8, name: 'Dia Internacional da Mulher' },
    { month: 3, day: 14, name: 'Dia da Poesia' },
    { month: 4, day: 19, name: 'Dia do Índio' },
    { month: 5, day: 13, name: 'Dia das Mães' }, // Aproximado
    { month: 6, day: 12, name: 'Dia dos Namorados' },
    { month: 6, day: 24, name: 'Dia de São João' },
    { month: 7, day: 20, name: 'Dia do Amigo' },
    { month: 8, day: 11, name: 'Dia dos Pais' }, // Aproximado
    { month: 9, day: 21, name: 'Dia da Árvore' },
    { month: 10, day: 15, name: 'Dia do Professor' },
    { month: 11, day: 20, name: 'Dia da Consciência Negra' },
    { month: 12, day: 31, name: 'Véspera de Ano Novo' },
  ];
  
  // Cálculo da Páscoa (Algoritmo de Meeus/Jones/Butcher)
  function calculateEaster(year: number): Date {
    const a = year % 19;
    const b = Math.floor(year / 100);
    const c = year % 100;
    const d = Math.floor(b / 4);
    const e = b % 4;
    const f = Math.floor((b + 8) / 25);
    const g = Math.floor((b - f + 1) / 3);
    const h = (19 * a + b - d - g + 15) % 30;
    const i = Math.floor(c / 4);
    const k = c % 4;
    const l = (32 + 2 * e + 2 * i - h - k) % 7;
    const m = Math.floor((a + 11 * h + 22 * l) / 451);
    const month = Math.floor((h + l - 7 * m + 114) / 31);
    const day = ((h + l - 7 * m + 114) % 31) + 1;
    
    return new Date(year, month - 1, day);
  }
  
  // Calcular feriados móveis baseados na Páscoa
  function calculateMovableHolidays(year: number): {date: Date, name: string}[] {
    const easter = calculateEaster(year);
    
    // Clonar a data da Páscoa
    const goodFriday = new Date(easter);
    goodFriday.setDate(easter.getDate() - 2);
    
    const carnivalTuesday = new Date(easter);
    carnivalTuesday.setDate(easter.getDate() - 47);
    
    const corpusChristi = new Date(easter);
    corpusChristi.setDate(easter.getDate() + 60);
    
    return [
      { date: easter, name: 'Páscoa' },
      { date: goodFriday, name: 'Sexta-feira Santa' },
      { date: carnivalTuesday, name: 'Carnaval' },
      { date: corpusChristi, name: 'Corpus Christi' }
    ];
  }
  
  const result: {date: Date, name: string}[] = [];
  
  // Adicionar feriados fixos
  fixedHolidays.forEach(holiday => {
    result.push({ 
      date: new Date(year, holiday.month - 1, holiday.day), 
      name: holiday.name 
    });
  });
  
  // Adicionar datas comemorativas
  commemorativeDates.forEach(date => {
    result.push({ 
      date: new Date(year, date.month - 1, date.day), 
      name: date.name 
    });
  });
  
  // Adicionar feriados móveis
  const movableHolidays = calculateMovableHolidays(year);
  movableHolidays.forEach(holiday => {
    result.push(holiday);
  });
  
  return result;
}
