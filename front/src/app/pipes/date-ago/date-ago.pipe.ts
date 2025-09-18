import { Pipe, PipeTransform } from '@angular/core'
import { getMonthString } from '../../utils/dates'

/**
 * Pipe pour afficher la date en fonction de la date passée en paramètre
 */
@Pipe({
  standalone: true,
  name: 'dateAgo',
})
export class DateAgoPipe implements PipeTransform {
  /**
   * Transforme la date en fonction de la date passée en paramètre
   * @param value
   * @param args
   * @returns
   */
  transform(value: any, args?: any): any {
    if (value) {
      const seconds = Math.floor((+new Date() - +new Date(value)) / 1000)
      if (seconds < 29)
        // less than 30 seconds ago will show as 'Just now'
        return "A l'instant"
      const intervals = {
        //'an': 31536000,
        //'mois': 2592000,
        //'semaine': 604800,
        jour: 86400,
        heure: 3600,
        minute: 60,
        seconde: 1,
      }
      if (seconds > 604800) return this.getRealValue(value)
      let counter
      for (const i in intervals) {
        counter = Math.floor(seconds / intervals[i as keyof typeof intervals])
        if (counter > 0)
          if (counter === 1) {
            return 'Il y a ' + counter + ' ' + i // singular (1 day ago)
          } else {
            return 'Il y a ' + counter + ' ' + i + (i === 'mois' ? '' : 's') // plural (2 days ago)
          }
      }
    }
    return value
  }

  /**
   * Renvoi la valeur de la date Mois - Année
   * @param date
   * @returns
   */
  getRealValue(date: Date | null) {
    if (date !== null) {
      date = new Date(date)
      return `${(date.getDate() + '').padStart(2, '0')} ${getMonthString(date)} ${date.getFullYear()}`
    } else return ''
  }
}
