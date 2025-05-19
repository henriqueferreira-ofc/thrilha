
export function calculateDaysUntilBirthday(birthdateStr: string): number {
  const today = new Date();
  
  // Tenta fazer o parse da data (podendo estar em formato ISO ou apenas data)
  const birthdate = birthdateStr.includes('T') 
    ? new Date(birthdateStr) 
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
}
