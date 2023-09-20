import { Subscription } from 'rxjs'
import {
  referentielMappingColor,
  referentielMappingName,
} from '../utils/referentiel'
import { categoryMappingName, categoryMappingColor } from '../utils/category'

import { environment } from '../../environments/environment'
import { fixDecimal } from '../utils/numbers'
import {
  decimalToStringDate,
  getMonthString,
  getShortMonthString,
  month,
  today,
} from '../utils/dates'
import {
  FONCTIONNAIRES,
  getBgCategoryColor,
  getCategoryColor,
  MAGISTRATS,
} from '../constants/category'
import { ETP_NEED_TO_BE_UPDATED } from '../constants/referentiel'
import { PLACEHOLDER_COLOR } from '../constants/colors'

/**
 * Class principal pour simplifier les doublons de méthodes générales
 */
export class MainClass {
  /**
   * Liste des watch pour les détruires après
   */
  watcherList: Subscription[] = []
  /**
   * Config d'environment
   */
  environment = environment
  /**
   * Variable global de string magistrat
   */
  MAGISTRATS = MAGISTRATS
  /**
   * Variable global de string fonctionnaires
   */
  FONCTIONNAIRES = FONCTIONNAIRES
  ETP_NEED_TO_BE_UPDATED = ETP_NEED_TO_BE_UPDATED
  PLACEHOLDER_COLOR = PLACEHOLDER_COLOR

  /**
   * Methode d'arrondi
   * @param n
   * @param base
   * @returns
   */
  fixDecimal(n: number, base?: number): number {
    return fixDecimal(n)
  }

  /**
   * Transformation d'une string en entirer
   * @param s
   * @returns
   */
  parseInt(s: string): number {
    return parseInt(s)
  }

  /**
   * Transformation d'une string en chiffre à virgule
   * @param s
   * @returns
   */
  parseFloat(s: string): number {
    if (s !== '') return parseFloat(s.replace(/,/, '.'))
    else return 0
  }

  /**
   * Ajout d'un observable à la liste des observables à supprimer après
   * @param sub
   */
  watch(sub: any) {
    this.watcherList.push(sub)
  }

  /**
   * Methode de suppression des observables
   */
  watcherDestroy() {
    this.watcherList.map((w) => {
      try {
        w.unsubscribe()
      } catch (err) {}
    })
  }

  /**
   * Methode de reprise des noms de référentiel
   */
  public referentielMappingName(name: string): string {
    return referentielMappingName(name)
  }

  /**
   * Methode de reprise des couleur des référentiel
   * @param name
   * @returns
   */
  public referentielMappingColor(name: string, opacity: number = 1): string {
    return referentielMappingColor(name, opacity)
  }

  /**
   * Methode de reprise des couleur de catégorie
   * @param name
   * @returns
   */
  public categoryMappingColor(
    name: string | undefined,
    opacity: number = 1
  ): string {
    return categoryMappingColor(name, opacity)
  }

  /**
   * Methode de reprise des noms de categori
   */
  public categoryMappingName(name: string): string {
    return categoryMappingName(name)
  }

  /**
   * Méthode de reconnaissance si c'est un IOS
   * @returns
   */
  public isOS() {
    return navigator.userAgent.indexOf('AppleWebKit') !== -1
  }

  /**
   * Méthode d'exclusion si c'est un IOS
   * @returns
   */
  public isNotOS() {
    return !this.isOS()
  }

  /**
   * Méthode d'accélaration des liste
   * @param index
   * @param item
   * @returns
   */
  public trackBy(index: number, item: any) {
    return item.id
  }

  /**
   * Récupération du mois à partir d'une date
   * @param date
   * @returns
   */
  public getMonthString(date: Date | undefined): string {
    return date ? getMonthString(date) : ''
  }

  /**
   * Récupération du diminutif du mois à partir d'une date
   * @param date
   * @returns
   */
  public getShortMonthString(date: Date | undefined): string {
    return date ? getShortMonthString(date) : ''
  }

  /**
   * Récupération d'une coleur d'une catégorie
   * @param label
   * @param opacity
   * @returns
   */
  public getCategoryColor(label: string | undefined, opacity: number = 1) {
    return getCategoryColor('' + label, opacity)
  }

  /**
   * Récupération d'une coleur de fond d'une catégorie
   * @param label
   * @param opacity
   * @returns
   */
  public getBgCategoryColor(label: string | undefined) {
    return getBgCategoryColor('' + label)
  }

  /**
   * Transforme une date en text
   * @param date
   * @returns
   */
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

  /**
   * Vérification si une date est la meme que aujourd'hui
   * @param date
   * @returns
   */
  public isToday(date: Date) {
    const now = new Date()

    return (
      now.getFullYear() === date.getFullYear() &&
      now.getMonth() === date.getMonth() &&
      now.getDate() === date.getDate()
    )
  }

  /**
   * Retourne la date d'aujourd'hui sinon du jour de la date choisie
   * @param date
   * @returns
   */
  public getToday(date: Date | null | undefined = new Date()): Date {
    return today(date)
  }

  /**
   * Retourne la date d'aujourd'hui sinon du jour de la date choisie
   * @param date
   * @returns
   */
  public getMonth(date: Date | null | undefined = new Date()): Date {
    return month(date)
  }

  /**
   * Retourne l'année d'une date en string ou objet
   * @param date
   * @returns
   */
  public getFullYear(date: Date | string | undefined) {
    if (date === undefined) {
      date = new Date()
    } else if (typeof date === 'string') {
      date = new Date(date)
    }

    return date.getFullYear()
  }

  /**
   * Transforme une date string en date objet
   * @param date
   * @returns
   */
  public getDate(date: Date | string | undefined) {
    if (date === undefined) {
      date = new Date()
    } else if (typeof date === 'string') {
      date = new Date(date)
    }

    return date.getDate()
  }

  /**
   * Compare deux dates et regarde si c'est le même mois
   * @param date1
   * @param date2
   * @returns
   */
  public isSameMonthAndYear(date1: Date | null, date2: Date | null) {
    date1 = new Date(date1 ? date1 : '')
    date2 = new Date(date2 ? date2 : '')

    return (
      date1.getMonth() === date2.getMonth() &&
      date1.getFullYear() === date2.getFullYear()
    )
  }

  /**
   * Converti un chiffre en heure humaine
   * @param decimal
   * @returns
   */
  public decimalToStringDate(decimal: number | null) {
    return decimalToStringDate(decimal)
  }

  /**
   * Show log with html rendering
   * @param event
   */
  public log(event: any) {
    console.log(event)
  }

  /**
   * On focus HTML élément
   * @param dom
   */
  public onFocus(dom: any) {
    if (!dom) {
      return
    }

    dom.focus()
  }

  /**
   * Fonction qui permet de scroller à un ID
   */
  public scrollTo(id: string, dom?: any, detalScrollY?: number) {
    const findElement = dom ? dom : document.getElementById("content")
    const findIdElement = document.getElementById(id)

    if (findElement && findIdElement) {
      const findTopElement = document.getElementById("top")
      let deltaToRemove = 0

      if(findTopElement) {
        deltaToRemove = findTopElement.getBoundingClientRect().height
      }

      findElement.scrollTo({
        behavior: "smooth",
        top: findIdElement.getBoundingClientRect().top - deltaToRemove - (detalScrollY || 0),
      })
    }
  }
}
