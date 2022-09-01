export const MONTH_LABEL = [
  'janvier',
  'février',
  'mars',
  'avril',
  'mai',
  'juin',
  'juillet',
  'aout',
  'septembre',
  'octobre',
  'novembre',
  'décembre',
];

export const convertHourMinutesToTimestamps = (hour, minute) => {
  return (hour || 1) * 60 * 60000 + (minute || 1) * 60000;
};

export const dayName = (date) => {
  if (typeof date === 'string') {
    date = new Date(date);
  }

  switch (date.getDay()) {
    case 1:
      return 'lundi';
    case 2:
      return 'mardi';
    case 3:
      return 'mercredi';
    case 4:
      return 'jeudi';
    case 5:
      return 'vendredi';
    case 6:
      return 'samedi';
    case 0:
      return 'dimanche';
  }
};

export const monthName = (date) => {
  if (typeof date === 'string') {
    date = new Date(date);
  }

  switch (date.getMonth()) {
    case 0:
      return 'janvier';
    case 1:
      return 'février';
    case 2:
      return 'mars';
    case 3:
      return 'avril';
    case 4:
      return 'mai';
    case 5:
      return 'juin';
    case 6:
      return 'juillet';
    case 7:
      return 'aout';
    case 8:
      return 'septembre';
    case 9:
      return 'octobre';
    case 10:
      return 'novembre';
    case 11:
      return 'décembre';
  }
};

export function today(date = new Date()) {
  const now = new Date(date);
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

export function month(date = new Date(), monthToAdd, lastDay) {
  const now = new Date(date);
  if (monthToAdd) {
    now.setDate(1);
    now.setMonth(now.getMonth() + monthToAdd);
  }
  return lastDay
    ? new Date(now.getFullYear(), now.getMonth() + 1, 0)
    : new Date(now.getFullYear(), now.getMonth());
}

export function getNbMonth(dateStart, dateStop) {
  let totalMonth = 0;

  const now = new Date(dateStart);
  do {
    totalMonth++;
    now.setMonth(now.getMonth() + 1);
  } while (now.getTime() <= dateStop.getTime());

  if (totalMonth <= 0) {
    totalMonth = 1;
  }

  return totalMonth;
}

export function isSameMonthAndYear(date1, date2) {
  date1 = new Date(date1);
  date2 = new Date(date2);

  return date1.getMonth() === date2.getMonth() && date1.getFullYear() === date2.getFullYear();
}

export function workingDay(date) {
  return [1, 2, 3, 4, 5].indexOf(date.getDay()) !== -1;
}

export function isDateBiggerThan(firstDate, secondDate) {
  firstDate = new Date(firstDate);
  secondDate = new Date(secondDate);

  return firstDate.getTime() >= secondDate.getTime();
}

export function getRangeOfMonthsAsObject(startDate, endDate, asObject = false) {
  const dates = new Array();
  const dateCounter = new Date(startDate);
  let monthlyL = {};

  dateCounter.setDate(1);

  while (dateCounter < endDate) {
    if (getShortMonthString(dateCounter) === 'Janv.')
      dates.push(
        `${getShortMonthString(dateCounter) + ' ' + dateCounter.getFullYear().toString().slice(-2)}`
      );
    else dates.push(`${getShortMonthString(dateCounter)}`);

    const str = getShortMonthString(dateCounter) + dateCounter.getFullYear().toString().slice(-2);
    if (asObject) {
      monthlyL[str] = { ...{} };
    }
    dateCounter.setMonth(dateCounter.getMonth() + 1);
  }

  if (asObject) return { ...monthlyL };

  if (dates.length === 1) return [dates[0], dates[0]];

  return dates;
}

export function getShortMonthString(date) {
  if (typeof date === 'string') {
    date = new Date(date);
  }
  return [
    'Janv.',
    'Févr.',
    'Mars',
    'Avr.',
    'Mai.',
    'Juin',
    'Juil.',
    'Août',
    'Sept.',
    'Oct.',
    'Nov.',
    'Déc.',
  ][date.getMonth()];
}
