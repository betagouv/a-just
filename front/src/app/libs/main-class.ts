import { Subscription } from 'rxjs'
import {
  referentielMappingColor,
  referentielMappingName,
} from '../utils/referentiel'
import { environment } from '../../environments/environment'
import { fixDecimal } from '../utils/numbers'
import { getMonthString, getShortMonthString, today } from '../utils/dates'
import { FONCTIONNAIRES, MAGISTRATS } from '../constants/category'

export class MainClass {
  watcherList: Subscription[] = []
  environment = environment
  MAGISTRATS = MAGISTRATS
  FONCTIONNAIRES = FONCTIONNAIRES

  fixDecimal(n: number): number {
    return fixDecimal(n)
  }

  parseInt(s: string): number {
    return parseInt(s)
  }

  parseFloat(s: string): number {
    return parseFloat(s.replace(/,/,'.'))
  }

  watch(sub: any) {
    this.watcherList.push(sub)
  }

  watcherDestroy() {
    this.watcherList.map((w) => {
      try {
        w.unsubscribe()
      } catch (err) {}
    })
  }

  public referentielMappingName(name: string): string {
    return referentielMappingName(name)
  }

  public referentielMappingColor(name: string): string {
    return referentielMappingColor(name)
  }

  public isOS() {
    return navigator.userAgent.indexOf('AppleWebKit') !== -1
  }

  public isNotOS() {
    return !this.isOS()
  }

  public trackBy(index: number, item: any) {
    return item.id
  }

  public getMonthString(date: Date | undefined): string {
    return date ? getMonthString(date) : ''
  }

  public getShortMonthString(date: Date | undefined): string {
    return date ? getShortMonthString(date) : ''
  }

  public getCategoryColor(label: string, opacity: number = 1) {
    switch (label) {
      case 'Magistrat':
      case 'Magistrat du siège':
      case 'Magistrats du siège':
        return `rgba(0, 0, 145, ${opacity})`
      case 'Fonctionnaire':
      case 'Fonctionnaires':
        return `rgba(165, 88, 160, ${opacity})`
    }

    return `rgba(239, 203, 58, ${opacity})`
  }

  public formatDate(date: Date) {
    if (!date) {
      return ''
    }

    const now = new Date()
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    let stringDate = ''

    if (
      now.getFullYear() === date.getFullYear() &&
      now.getMonth() === date.getMonth() &&
      now.getDate() === date.getDate()
    ) {
      stringDate = "aujourd'hui"
    } else if (
      yesterday.getFullYear() === date.getFullYear() &&
      yesterday.getMonth() === date.getMonth() &&
      yesterday.getDate() === date.getDate()
    ) {
      stringDate = 'hier'
    } else {
      stringDate = `le ${(date.getDate() + '').padStart(
        2,
        '0'
      )} ${this.getShortMonthString(date)} ${date.getFullYear()}`
    }

    return `${stringDate} à ${(date.getHours() + '').padStart(2, '0')}:${(
      date.getMinutes() + ''
    ).padStart(2, '0')}`
  }

  public isToday(date: Date) {
    const now = new Date()

    return (
      now.getFullYear() === date.getFullYear() &&
      now.getMonth() === date.getMonth() &&
      now.getDate() === date.getDate()
    )
  }

  public getToday(date: Date | null | undefined = new Date()): Date {
    return today(date)
  }

  public getFullYear(date: Date | string) {
    if (typeof date === 'string') {
      date = new Date(date)
    }

    return date.getFullYear()
  }

  public getDate(date: Date | string) {
    if (typeof date === 'string') {
      date = new Date(date)
    }

    return date.getDate()
  }

  public isSameMonthAndYear(date1: Date | null, date2: Date | null) {
    date1 = new Date(date1 ? date1 : '')
    date2 = new Date(date2 ? date2 : '')

    return (
      date1.getMonth() === date2.getMonth() &&
      date1.getFullYear() === date2.getFullYear()
    )
  }
}
