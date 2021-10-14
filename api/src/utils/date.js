export const MONTH_LABEL = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'aout', 'septembre', 'octobre', 'novembre', 'décembre']

export const convertHourMinutesToTimestamps = (hour, minute) => {
  return (hour || 1) * 60 * 60000 + (minute || 1) * 60000
}

export const dayName = (date) => {
  if (typeof date === 'string') {
    date = new Date(date)
  }

  switch (date.getDay()) {
  case 1:
    return 'lundi'
  case 2:
    return 'mardi'
  case 3:
    return 'mercredi'
  case 4:
    return 'jeudi'
  case 5:
    return 'vendredi'
  case 6:
    return 'samedi'
  case 0:
    return 'dimanche'
  }
}

export const monthName = (date) => {
  if (typeof date === 'string') {
    date = new Date(date)
  }

  switch (date.getMonth()) {
  case 0:
    return 'janvier'
  case 1:
    return 'février'
  case 2:
    return 'mars'
  case 3:
    return 'avril'
  case 4:
    return 'mai'
  case 5:
    return 'juin'
  case 6:
    return 'juillet'
  case 7:
    return 'aout'
  case 8:
    return 'septembre'
  case 9:
    return 'octobre'
  case 10:
    return 'novembre'
  case 11:
    return 'décembre'
  }
}
