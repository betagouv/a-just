import { Component, Input, OnChanges } from '@angular/core';
import { MainClass } from 'src/app/libs/main-class';
import { SimulatorService } from 'src/app/services/simulator/simulator.service';
import { monthDiffList, nbOfDays } from 'src/app/utils/dates';

@Component({
  selector: 'aj-period-selector',
  templateUrl: './period-selector.component.html',
  styleUrls: ['./period-selector.component.scss']
})
export class PeriodSelectorComponent extends MainClass implements OnChanges {

  /**
   * Mode de simulation
   */
  @Input() whiteSimulator: boolean = false

  /**
   * Date du jour
   */
  today = new Date()

  /**
  * Indicateur de selection de paramètre de simulation
  */
  disabled: string = ''

  /**
 * Indicateur de saisie date de début de simulation
 */
  mooveClass: string = ''

  /**
    * Date de début de simulation
    */
  dateStart: Date = new Date()
  /**
   * Date de fin de simulation
   */
  dateStop: Date | null = null
  /**
   * Nombre de mois contenu dans la période selectionnée
   */
  nbOfMonthWithinPeriod: number[] = []
  /**
 * Nombre de jour de simulation à blanc
 */
  whiteNbOfDays: number = 0

  /**
   * Constructeur
   */
  constructor(private simulatorService: SimulatorService) {
    super()

    this.watch(
      this.simulatorService.contentieuOrSubContentieuId.subscribe((ids) => {
        if (this.whiteSimulator) {
          if (ids === null) this.disabled = ''
          else this.disabled = 'disabled'
        }
        if (ids === null) {
          this.mooveClass = ''
          this.dateStop = null
          this.dateStart = new Date()
        }
      }))

    this.watch(
      this.simulatorService.disabled.subscribe((disabled) => {
        if (this.whiteSimulator && this.simulatorService.contentieuOrSubContentieuId.getValue() === null) this.disabled = ''
        else this.disabled = disabled
      }))

    this.watch(
      this.simulatorService.situationSimulated.subscribe((situation) => {
        if (this.whiteSimulator) {
          if (situation === null) this.disabled = ''
          else this.disabled = 'disabled'
        }
        if (situation === null) {
          this.mooveClass = ''
          this.dateStop = null
          this.dateStart = new Date()
        }
      }))
  }

  ngOnChanges(change: any) {
    if (change.whiteSimulator && change.whiteSimulator.currentValue === true)
      this.disabled = ''

  }
  updateDateSelected(type: string = '', event: any = null) {
    if (this.whiteSimulator === false) {
      if (type === 'dateStart') {
        this.dateStart = new Date(event)
        this.simulatorService.dateStart.next(this.dateStart)
        this.nbOfMonthWithinPeriod = monthDiffList(this.dateStart, this.dateStop)
        if (
          this.dateStart.getDate() !== this.today.getDate() ||
          this.dateStart.getMonth() !== this.today.getMonth() ||
          this.dateStart.getFullYear() !== this.today.getFullYear()
        )
          this.mooveClass = 'future'
        else if (this.dateStop === null) this.mooveClass = ''
        else this.mooveClass = 'present'
        this.disabled = 'disabled-date'
        this.simulatorService.disabled.next(this.disabled)

        this.simulatorService.dateStart.next(this.dateStart)
      } else if (type === 'dateStop') {
        this.disabled = 'disabled-date'
        this.simulatorService.disabled.next(this.disabled)


        this.dateStop = new Date(event)
        if (
          this.dateStart.getDate() !== this.today.getDate() ||
          this.dateStart.getMonth() !== this.today.getMonth() ||
          this.dateStart.getFullYear() !== this.today.getFullYear()
        )
          this.mooveClass = 'future'
        else this.mooveClass = 'present'
        this.simulatorService.dateStop.next(this.dateStop)
        this.nbOfMonthWithinPeriod = monthDiffList(this.dateStart, this.dateStop)
      }
    }
    else {
      if (type === 'dateStart') {
        this.disabled = 'disabled-date'
        this.simulatorService.disabled.next(this.disabled)
        this.dateStart = new Date(event)
        this.simulatorService.dateStart.next(this.dateStart)
      }
      else if (type === 'dateStop') {
        this.disabled = 'disabled-date'
        this.simulatorService.disabled.next(this.disabled)
        this.dateStop = new Date(event)
        this.simulatorService.dateStop.next(this.dateStop)
        this.simulatorService.whiteSimulatorNbOfDays.next(nbOfDays(this.dateStart, this.dateStop))
      }

    }
  }

  /**
  *  Get minimum date you can select on the date picker
  */
  getMin(): Date {
    const date = new Date(this.dateStart)
    date.setDate(this.dateStart.getDate() + 1)
    return date
  }
}
