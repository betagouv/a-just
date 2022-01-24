export function monthDiff(d1: Date, d2: Date) {
  var months;
  months = (d2.getFullYear() - d1.getFullYear()) * 12;
  months -= d1.getMonth();
  months += d2.getMonth();
  return months <= 0 ? 0 : months;
}

export function workingDay(date: Date) {
  return [1,2,3,4,5].indexOf(date.getDay()) !== -1
}

export function getMonthString(date: Date | string) {
  if(typeof date === 'string') {
    date = new Date(date);
  }
  return ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'][date.getMonth()]
}

export function getShortMonthString(date: Date | string) {
  if(typeof date === 'string') {
    date = new Date(date);
  }
  return ['Janv.', 'Févr.', 'Mars', 'Avr.', 'Mai', 'Juin', 'Juil.', 'Août', 'Sept.', 'Oct.', 'Nov.', 'Déc.'][date.getMonth()]
}