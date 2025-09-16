import { Component, inject, Input, OnChanges } from '@angular/core'
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms'
import { pairwise, startWith } from 'rxjs'
import { MainClass } from '../../../libs/main-class'
import { TooltipsComponent } from '../../../components/tooltips/tooltips.component'
import { CommonModule } from '@angular/common'
import { SimulatorService } from '../../../services/simulator/simulator.service'
import { fixDecimal } from '../../../utils/numbers'
import { basicEtptData } from '../../../constants/etpt-calculation'
import { decimalToStringDate } from '../../../utils/dates'
import { MatTooltipModule } from '@angular/material/tooltip'
import { TimeSelectorComponent } from '../../../components/time-selector/time-selector.component'
import { WHITE_SIMULATOR_START } from '../../../constants/log-codes'
import { KPIService } from '../../../services/kpi/kpi.service'

/**
 * Variable ETP magistrat factor
 */
const etpMagFactor = (208 / 12) * 8
/**
 * Variable ETP greffe factor
 */
const etpGreffeFactor = (229.57 / 12) * 7

@Component({
  selector: 'aj-editable-situation',
  standalone: true,
  imports: [TooltipsComponent, FormsModule, CommonModule, MatTooltipModule, ReactiveFormsModule, TimeSelectorComponent],
  templateUrl: './editable-situation.component.html',
  styleUrls: ['./editable-situation.component.scss'],
})
export class EditableSituationComponent extends MainClass implements OnChanges {
  /**
   * Service de simulation
   */
  simulatorService = inject(SimulatorService)
  /**
   * Service de KPI
   */
  kPIService = inject(KPIService)

  /**
   * Number of day to simulate
   */
  nbOfDays: number = 0

  /**
   * Date de fin à afficher
   */
  @Input() endDateToDisplay: string = ''

  /**
   * Catégorie
   */
  @Input()
  set category(value: string | null) {
    this._category = value
  }
  get category(): string | null {
    return this._category
  }
  /**
   * Catégorie
   */
  private _category: string | null = null

  /**
   * RegEx
   */
  numberRegex = '^[0-9]*$'
  /**
   * Formulaire de saisie
   */
  formWhiteSim = new FormGroup({
    totalIn: new FormControl('', [Validators.required, Validators.pattern(this.numberRegex)]),
    totalOut: new FormControl('', [Validators.required, Validators.pattern(this.numberRegex)]),
    lastStock: new FormControl('', [Validators.required, Validators.pattern(this.numberRegex)]),
    etpMag: new FormControl('', [Validators.required, Validators.pattern(this.numberRegex)]),
    etpFon: new FormControl('', [Validators.required, Validators.pattern(this.numberRegex)]),
    //etpCont: new FormControl({value:'',disabled: true}),
    etpCont: new FormControl('', [Validators.required, Validators.pattern(this.numberRegex)]),
    realCoverage: new FormControl('', [Validators.required, Validators.pattern(this.numberRegex)]),
    realDTESInMonths: new FormControl('', [Validators.required, Validators.pattern(this.numberRegex)]),
    magRealTimePerCase: new FormControl('', [
      //Validators.required,
      //Validators.pattern(this.numberRegex),
    ]),
  })

  /**
   * Objet de la situation de fin
   */
  endSituation = {
    totalIn: 0,
    totalOut: 0,
    lastStock: 0,
    etpMag: 0,
    etpFon: 0,
    etpCont: null,
    realCoverage: 0,
    realDTESInMonths: 0,
    magRealTimePerCase: 0,
  }

  /**
   * Objet de la situation de fin
   */
  endSituationDisplay = {
    realCoverage: '',
    realDTESInMonths: '',
    magRealTimePerCase: '',
  }
  /**
   * Expression reguliaire number positiv only
   */
  regex = '/^d+$/'
  /**
   * Objet regex
   */
  regexObj = new RegExp('^[0-9]+$')
  /**
   * Bool to check if beginning situation is validated
   */
  isValidatedWhiteSimu: boolean = false
  /**
   * Afficher la situation de fin
   */
  displayEndSituation: boolean = false

  /**
   * Paramètres verrouillés
   */
  lockedParams = new Array()

  /**
   * Bool to check if beginning situation is validated
   */
  pressedKey = false
  /**
   * Bool to check if beginning situation is validated
   */

  /**
   * Bool to check if beginning situation is validated
   */
  disabledTmd = false

  /**
   * Bool to check if beginning situation is validated
   */
  defaultTmd = -1

  /**
   * Constructor
   */
  constructor() {
    super()
    this.formWhiteSim.valueChanges.pipe(startWith(this.formWhiteSim.value), pairwise()).subscribe(async (val) => {
      await this.changeInRealTime(val)
    })
    this.watch(
      this.simulatorService.whiteSimulatorNbOfDays.subscribe((nbDays) => {
        this.nbOfDays = nbDays
      }),
    )

    this.watch(
      this.simulatorService.situationProjected.subscribe((d) => {
        if (d === null) {
          this.displayEndSituation = false
          this.initFields()
          this.editWhiteSimulator()
        }
      }),
    )
  }

  /**
   * Change in real time
   * @param val
   */
  async changeInRealTime(val: any) {
    if (this.pressedKey === true) {
      this.pressedKey = false
      let { actualSituation, input } = this.getUpdatedFormValue(val)
      if (input.value === -1 && this.checkIfEmptyCounter() !== 1) {
        this.initFields()
        return
      }

      //console.log('actual situ', actualSituation);
      const etpFactor = this._category === 'MAGISTRAT' ? etpMagFactor : etpGreffeFactor
      let eq = { field: '', value: -1 }
      if (input.field !== undefined) {
        switch (input.field) {
          case 'totalIn': {
            if (this.lockedParams.includes('realCoverage') && actualSituation['totalOut'] !== '')
              eq = {
                field: 'realCoverage',
                value: (actualSituation['totalOut'] / actualSituation['totalIn']) * 100,
              }
            else if (this.lockedParams.includes('totalOut') && actualSituation['realCoverage'] !== '')
              eq = {
                field: 'totalOut',
                value: actualSituation['totalIn'] * (actualSituation['realCoverage'] / 100),
              }
            else if (actualSituation['totalOut'] !== '') {
              eq = {
                field: 'realCoverage',
                value: (actualSituation['totalOut'] / actualSituation['totalIn']) * 100,
              }
              this.lockedParams.push('realCoverage')
            } else if (actualSituation['realCoverage'] !== '') {
              eq = {
                field: 'totalOut',
                value: actualSituation['totalIn'] * (actualSituation['realCoverage'] / 100),
              }
              this.lockedParams.push('totalOut')
            }
            break
          }
          case 'totalOut': {
            if (
              actualSituation['totalIn'] !== '' &&
              !this.lockedParams.includes('totalIn') &&
              (this.lockedParams.includes('realCoverage') || actualSituation['realCoverage'] === '')
            ) {
              eq = {
                field: 'realCoverage',
                value: (actualSituation['totalOut'] / actualSituation['totalIn']) * 100,
              }
              actualSituation['realCoverage'] === '' ? this.lockedParams.push('realCoverage') : null
              this.disableElement(eq)
            }
            if (
              actualSituation['lastStock'] !== '' &&
              !this.lockedParams.includes('lastStock') &&
              (this.lockedParams.includes('realDTESInMonths') || actualSituation['realDTESInMonths'] === '')
            ) {
              eq = {
                field: 'realDTESInMonths',
                value: actualSituation['totalOut'] / actualSituation['lastStock'],
              }
              actualSituation['realDTESInMonths'] === '' ? this.lockedParams.push('realDTESInMonths') : null
              this.disableElement(eq)
            }
            if (
              actualSituation['etpMag'] !== '' &&
              !this.lockedParams.includes('etpMag') &&
              (this.lockedParams.includes('magRealTimePerCase') || actualSituation['magRealTimePerCase'] === '')
            ) {
              eq = {
                field: 'magRealTimePerCase',
                value: (etpFactor * actualSituation['etpMag']) / actualSituation['totalOut'],
              }
              actualSituation['magRealTimePerCase'] === '' ? this.lockedParams.push('magRealTimePerCase') : null
              this.disableElement(eq)
            }
            if (
              actualSituation['realCoverage'] !== '' &&
              !this.lockedParams.includes('realCoverage') &&
              (this.lockedParams.includes('totalIn') || actualSituation['totalIn'] === '')
            ) {
              eq = {
                field: 'totalIn',
                value: actualSituation['totalOut'] / (actualSituation['realCoverage'] / 100),
              }
              actualSituation['totalIn'] === '' ? this.lockedParams.push('totalIn') : null
              this.disableElement(eq)
            }
            if (
              actualSituation['realDTESInMonths'] !== '' &&
              !this.lockedParams.includes('realDTESInMonths') &&
              (this.lockedParams.includes('lastStock') || actualSituation['lastStock'] === '')
            ) {
              eq = {
                field: 'lastStock',
                value: actualSituation['realDTESInMonths'] * actualSituation['totalOut'],
              }
              actualSituation['lastStock'] === '' ? this.lockedParams.push('lastStock') : null
              this.disableElement(eq)
            }
            if (
              actualSituation['magRealTimePerCase'] !== '' &&
              !this.lockedParams.includes('magRealTimePerCase') &&
              (this.lockedParams.includes('etpMag') || actualSituation['etpMag'] === '')
            ) {
              eq = {
                field: 'etpMag',
                value: (actualSituation['magRealTimePerCase'] * actualSituation['totalOut']) / (17.333 * 8),
              }
              actualSituation['etpMag'] === '' ? this.lockedParams.push('etpMag') : null
              this.disableElement(eq)
            }
            break
          }
          case 'lastStock': {
            if (this.lockedParams.includes('realDTESInMonths') && actualSituation['totalOut'] !== '')
              eq = {
                field: 'realDTESInMonths',
                value: actualSituation['lastStock'] / actualSituation['totalOut'],
              }
            else if (this.lockedParams.includes('totalOut') && actualSituation['realDTESInMonths'] !== '')
              eq = {
                field: 'totalOut',
                value: actualSituation['lastStock'] / actualSituation['realDTESInMonths'],
              }
            else if (actualSituation['totalOut'] !== '') {
              eq = {
                field: 'realDTESInMonths',
                value: actualSituation['lastStock'] / actualSituation['totalOut'],
              }
              this.lockedParams.push('realDTESInMonths')
            } else if (actualSituation['realDTESInMonths'] !== '') {
              eq = {
                field: 'totalOut',
                value: actualSituation['lastStock'] / actualSituation['realDTESInMonths'],
              }
              this.lockedParams.push('totalOut')
            }
            break
          }
          case 'etpMag': {
            if (this.lockedParams.includes('magRealTimePerCase') && actualSituation['totalOut'] !== '') {
              eq = {
                field: 'magRealTimePerCase',
                value: (etpFactor * actualSituation['etpMag']) / actualSituation['totalOut'],
              }
            }
            if (this.lockedParams.includes('totalOut') && actualSituation['magRealTimePerCase'] !== '') {
              eq = {
                field: 'totalOut',
                value: (etpFactor * actualSituation['etpMag']) / actualSituation['magRealTimePerCase'],
              }
            } else if (actualSituation['totalOut'] !== '') {
              eq = {
                field: 'magRealTimePerCase',
                value: (etpFactor * actualSituation['etpMag']) / actualSituation['totalOut'],
              }
              this.lockedParams.push('magRealTimePerCase')
              /**
              console.log(
                'TMDDDD',
                (etpFactor * actualSituation['etpMag']) /
                  actualSituation['totalOut'],
                etpFactor,
                actualSituation['etpMag'],
                actualSituation['totalOut']
              ); */
            } else if (actualSituation['magRealTimePerCase'] !== '') {
              eq = {
                field: 'totalOut',
                value: (etpFactor * actualSituation['etpMag']) / actualSituation['magRealTimePerCase'],
              }
              this.lockedParams.push('totalOut')
            }
            break
          }
          case 'realCoverage': {
            if (this.lockedParams.includes('totalIn') && actualSituation['realCoverage'] !== '')
              eq = {
                field: 'totalIn',
                value: actualSituation['totalOut'] / (actualSituation['realCoverage'] / 100),
              }
            else if (this.lockedParams.includes('totalOut') && actualSituation['totalIn'] !== '')
              eq = {
                field: 'totalOut',
                value: Number(actualSituation['totalIn']) * (Number(actualSituation['realCoverage']) / 100),
              }
            else if (actualSituation['totalOut'] !== '') {
              eq = {
                field: 'totalIn',
                value: actualSituation['totalOut'] / actualSituation['realCoverage'] / 100,
              }
              this.lockedParams.push('totalIn')
            } else if (actualSituation['totalIn'] !== '') {
              eq = {
                field: 'totalOut',
                value: actualSituation['totalIn'] * (actualSituation['realCoverage'] / 100),
              }
              this.lockedParams.push('totalOut')
            }
            break
          }
          case 'realDTESInMonths': {
            if (this.lockedParams.includes('lastStock') && actualSituation['totalOut'] !== '')
              eq = {
                field: 'lastStock',
                value: actualSituation['realDTESInMonths'] * actualSituation['totalOut'],
              }
            if (this.lockedParams.includes('totalOut') && actualSituation['lastStock'] !== '')
              eq = {
                field: 'totalOut',
                value: actualSituation['lastStock'] / actualSituation['realDTESInMonths'],
              }
            else if (actualSituation['totalOut'] !== '') {
              eq = {
                field: 'lastStock',
                value: actualSituation['realDTESInMonths'] * actualSituation['totalOut'],
              }
              this.lockedParams.push('lastStock')
            } else if (actualSituation['lastStock'] !== '') {
              eq = {
                field: 'totalOut',
                value: actualSituation['lastStock'] / actualSituation['realDTESInMonths'],
              }
              this.lockedParams.push('totalOut')
            }
            break
          }
          case 'magRealTimePerCase': {
            if (this.lockedParams.includes('etpMag') && actualSituation['totalOut'] !== '')
              eq = {
                field: 'etpMag',
                value: (actualSituation['magRealTimePerCase'] * actualSituation['totalOut']) / etpFactor,
              }
            else if (this.lockedParams.includes('totalOut') && actualSituation['etpMag'] !== '')
              eq = {
                field: 'totalOut',
                value: (etpFactor * actualSituation['etpMag']) / actualSituation['magRealTimePerCase'],
              }
            else if (actualSituation['totalOut'] !== '') {
              eq = {
                field: 'etpMag',
                value: (actualSituation['magRealTimePerCase'] * actualSituation['totalOut']) / etpFactor,
              }
              this.lockedParams.push('etpMag')
            } else if (actualSituation['etpMag'] !== '') {
              eq = {
                field: 'totalOut',
                value: (etpFactor * actualSituation['etpMag']) / actualSituation['magRealTimePerCase'],
              }
              this.lockedParams.push('totalOut')
            }
            break
          }
        }

        if (eq.field && !isNaN(eq.value)) {
          actualSituation = {
            ...actualSituation,
            [eq.field]: String(eq.value),
          }
          this.disableElement(eq)
          if (eq.field === 'totalOut') {
            Object.keys(this.formWhiteSim.controls).forEach((key) => {
              switch (key) {
                case 'totalOut': {
                  if (
                    actualSituation['totalIn'] !== '' &&
                    !this.lockedParams.includes('totalIn') &&
                    (this.lockedParams.includes('realCoverage') || actualSituation['realCoverage'] === '') &&
                    input.field !== 'realCoverage'
                  ) {
                    eq = {
                      field: 'realCoverage',
                      value: (actualSituation['totalOut'] / actualSituation['totalIn']) * 100,
                    }
                    actualSituation['realCoverage'] === '' ? this.lockedParams.push('realCoverage') : null
                    this.disableElement(eq)
                  }
                  if (
                    actualSituation['lastStock'] !== '' &&
                    !this.lockedParams.includes('lastStock') &&
                    (this.lockedParams.includes('realDTESInMonths') || actualSituation['realDTESInMonths'] === '') &&
                    input.field !== 'realDTESInMonths'
                  ) {
                    eq = {
                      field: 'realDTESInMonths',
                      value: actualSituation['lastStock'] / actualSituation['totalOut'],
                    }
                    actualSituation['realDTESInMonths'] === '' ? this.lockedParams.push('realDTESInMonths') : null
                    this.disableElement(eq)
                  }
                  if (
                    actualSituation['etpMag'] !== '' &&
                    !this.lockedParams.includes('etpMag') &&
                    (this.lockedParams.includes('magRealTimePerCase') || actualSituation['magRealTimePerCase'] === '') &&
                    input.field !== 'magRealTimePerCase'
                  ) {
                    eq = {
                      field: 'magRealTimePerCase',
                      value: (etpFactor * actualSituation['etpMag']) / actualSituation['totalOut'],
                    }
                    actualSituation['magRealTimePerCase'] === '' ? this.lockedParams.push('magRealTimePerCase') : null
                    this.disableElement(eq)
                  }
                  if (
                    actualSituation['realCoverage'] !== '' &&
                    !this.lockedParams.includes('realCoverage') &&
                    (this.lockedParams.includes('totalIn') || actualSituation['totalIn'] === '') &&
                    input.field !== 'totalIn'
                  ) {
                    eq = {
                      field: 'totalIn',
                      value: (actualSituation['totalOut'] / actualSituation['realCoverage']) * 100,
                    }
                    actualSituation['totalIn'] === '' ? this.lockedParams.push('totalIn') : null
                    this.disableElement(eq)
                  }
                  if (
                    actualSituation['realDTESInMonths'] !== '' &&
                    !this.lockedParams.includes('realDTESInMonths') &&
                    (this.lockedParams.includes('lastStock') || actualSituation['lastStock'] === '') &&
                    input.field !== 'lastStock'
                  ) {
                    eq = {
                      field: 'lastStock',
                      value: actualSituation['realDTESInMonths'] * actualSituation['totalOut'],
                    }
                    actualSituation['lastStock'] === '' ? this.lockedParams.push('lastStock') : null
                    this.disableElement(eq)
                  }
                  if (
                    actualSituation['magRealTimePerCase'] !== '' &&
                    !this.lockedParams.includes('magRealTimePerCase') &&
                    (this.lockedParams.includes('etpMag') || actualSituation['etpMag'] === '') &&
                    input.field !== 'etpMag'
                  ) {
                    eq = {
                      field: 'etpMag',
                      value: (actualSituation['magRealTimePerCase'] * actualSituation['totalOut']) / (17.333 * 8),
                    }
                    actualSituation['etpMag'] === '' ? this.lockedParams.push('etpMag') : null
                    this.disableElement(eq)
                  }
                }
              }
            })
          }
        }
      }
    }
  }

  /**
   * Indique si une valeur est finit ou si c'est une division par 0
   * @param val
   * @returns
   */
  getFiniteValue(val: string) {
    switch (val) {
      case 'realCoverage': {
        if (this.formWhiteSim.controls[val].value?.includes('%')) return false
        return !isFinite(Number(this.formWhiteSim.controls[val].value))
      }
      case 'realDTESInMonths':
        return !isFinite(Number(this.formWhiteSim.controls[val].value))
      case 'magRealTimePerCase':
        return !isFinite(Number(this.formWhiteSim.controls[val].value))
    }
    return true
  }

  /**
   * Indique si une valeur est finit ou si c'est une division par 0
   * @param val
   * @returns
   */
  getDTESValue(val: string) {
    if (Number(val) < 0) return '0'
    else return val
  }

  /**
   * Initialisation des champs
   */
  initFields() {
    Object.keys(this.formWhiteSim.controls).forEach((key) => {
      this.formWhiteSim.patchValue({ [key]: '' })
      if (this.lockedParams.includes(key)) {
        const element = document.querySelector("input[formControlName='" + key + "']")
        if (element?.classList.contains('grey-bg-disabled')) element?.classList.remove('grey-bg-disabled')
        element?.removeAttribute('disabled')
        this.disabledTmd = false
      }
    })
    this.defaultTmd = -1
    this.lockedParams = new Array()
  }

  /**
   * Disable element
   * @param eq
   */
  disableElement(eq: any) {
    this.formWhiteSim.patchValue({ [eq.field]: String(eq.value) })
    if (this.lockedParams.includes(eq.field)) {
      const element = document.querySelector("input[formControlName='" + eq.field + "']")
      element?.classList.add('grey-bg-disabled')
      element?.setAttribute('disabled', 'disabled')
      if (this.lockedParams.includes('magRealTimePerCase')) {
        this.disabledTmd = true
      }
    }
  }

  /**
   * Change in real time
   * @param changes
   */
  ngOnChanges(changes: any) {
    if (this.isValidatedWhiteSimu) this.generateEndSituation()
  }
  /**
   * Validate beginning situation for white simulator
   */
  validateWhiteSimulator() {
    let { totalIn, totalOut, lastStock, etpMag, etpFon, etpCont, realCoverage, realDTESInMonths, magRealTimePerCase } = this.formWhiteSim.value

    if (![totalIn, totalOut, lastStock].includes('') && ![totalIn, totalOut].includes('0') && (etpMag !== '' || etpFon !== '')) {
      this.generateEndSituation()
      this.isValidatedWhiteSimu = true
      this.displayEndSituation = true
      this.simulatorService.isValidatedWhiteSimu.next(this.isValidatedWhiteSimu)
      this.kPIService.register(WHITE_SIMULATOR_START)
    }
  }
  /**
   * Récupère la valeur mise à jour dans un formGroup
   * @param value
   * @returns
   */
  getUpdatedFormValue(value: any) {
    const oldValues = value[0] as { [key: string]: any }
    const newValues = value[1] as { [key: string]: any }
    const keyChanged = Object.keys(value[0]).filter((key) => oldValues[key] !== newValues[key])[0]

    Object.keys(newValues).map((key) => {
      newValues[key] = newValues[key].replaceAll(',', '.')
    })

    return {
      actualSituation: newValues,
      input: {
        field: keyChanged,
        value: newValues[keyChanged] === '' ? -1 : Number(newValues[keyChanged].replaceAll(',', '.')),
      },
    }
  }

  /**
   * Edit white simulator
   */
  editWhiteSimulator() {
    this.isValidatedWhiteSimu = false
    this.displayEndSituation = false
    this.simulatorService.isValidatedWhiteSimu.next(false)
    const coverage = this.formWhiteSim.controls['realCoverage'].value
    if (coverage?.includes('%')) this.formWhiteSim.controls['realCoverage'].setValue(coverage.replace('%', ''))
  }

  /**
   * Generate end situation
   */
  generateEndSituation() {
    this.replaceSeparator()

    const startTotalIn = parseFloat(this.formWhiteSim.controls['totalIn'].value || '0')

    this.formWhiteSim.controls['totalIn'].setValue(fixDecimal(startTotalIn) + '')

    const startTotalOut = parseFloat(this.formWhiteSim.controls['totalOut'].value || '0')

    this.formWhiteSim.controls['totalOut'].setValue(fixDecimal(startTotalOut) + '')

    const startLastStock = parseFloat(this.formWhiteSim.controls['lastStock'].value || '0')

    this.formWhiteSim.controls['lastStock'].setValue(Math.round(startLastStock) + '')

    const startetpMag = parseFloat(this.formWhiteSim.controls['etpMag'].value || '0')
    const startetpFon = parseFloat(this.formWhiteSim.controls['etpMag'].value || '0')
    const startetpCont = Number(this.formWhiteSim.controls['etpCont'].value)

    let coverage = Number(this.formWhiteSim.controls['realCoverage'].value)
    if (this.lockedParams.includes('realCoverage')) {
      coverage = (startTotalOut / startTotalIn) * 100
    }
    this.formWhiteSim.controls['realCoverage'].setValue(String(Math.round(coverage)) + '%')

    const dtes = startLastStock / startTotalOut
    this.formWhiteSim.controls['realDTESInMonths'].setValue(String(fixDecimal(dtes)))

    this.formWhiteSim.controls['etpMag'].setValue(String(fixDecimal(startetpMag)).replaceAll('.', ','))
    const prefix1 = this.category === 'MAGISTRAT' ? 'nbDaysByMagistrat' : 'nbDaysByFonctionnaire'
    const prefix2 = this.category === 'MAGISTRAT' ? 'nbHoursPerDayAndMagistrat' : 'nbHoursPerDayAndFonctionnaire'
    const etpToUse = this.category === 'MAGISTRAT' ? startetpMag : startetpFon

    let realTime = (basicEtptData[prefix1] * basicEtptData[prefix2] * etpToUse) / (startTotalOut * 12)

    const tmd = realTime
    /**   Math.trunc(realTime) +
      Math.round((realTime - Math.trunc(realTime)) * 60) / 60;*/

    this.simulatorService.situationActuelle.next({
      totalIn: startTotalIn,
      totalOut: startTotalOut,
      lastStock: startLastStock,
      etpMag: this.category === 'MAGISTRAT' ? startetpMag : 0,
      etpFon: this.category !== 'MAGISTRAT' ? startetpFon : 0,
      etpCont: startetpCont,
      realCoverage: coverage / 100,
      realDTESInMonths: dtes,
      magRealTimePerCase: tmd,
      magCalculateCoverage: 0,
      fonCalculateCoverage: 0,
      magCalculateDTESInMonths: 0,
      fonCalculateDTESInMonths: 0,
      magCalculateTimePerCase: 0,
      nbMonth: 0,
      etpAffected: [
        { name: 'Magistrat', totalEtp: 0, rank: 1 },
        { name: 'Greffe', totalEtp: 0, rank: 2 },
        { name: 'Autour du magistrat', totalEtp: 0, rank: 3 },
      ],
    })

    const endStock = startLastStock + (this.nbOfDays / (365 / 12)) * startTotalIn - (this.nbOfDays / (365 / 12)) * startTotalOut

    this.endSituation = {
      totalIn: fixDecimal(startTotalIn),
      totalOut: fixDecimal(startTotalOut),
      lastStock: Math.round(endStock),
      etpMag: this.category === 'MAGISTRAT' ? fixDecimal(startetpMag) : 0,
      etpFon: this.category !== 'MAGISTRAT' ? fixDecimal(startetpFon) : 0,
      etpCont: null,
      realCoverage: Math.round(coverage),
      realDTESInMonths: fixDecimal(endStock / startTotalOut),
      magRealTimePerCase: tmd,
    }
    this.endSituationDisplay.realCoverage = Math.round(coverage) + '%'
    this.endSituationDisplay.realDTESInMonths = fixDecimal(endStock / startTotalOut) + '' //+ ' mois'
    //this.endSituationDisplay.magRealTimePerCase = String(tmd) //decimalToStringDate(tmd, ':')

    this.simulatorService.situationProjected.next({
      ...this.endSituation,
      realCoverage: coverage / 100,
      magCalculateCoverage: null,
      fonCalculateCoverage: null,
      magCalculateDTESInMonths: null,
      fonCalculateDTESInMonths: null,
      magCalculateTimePerCase: null,
      nbMonth: 0,
      etpAffected: null,
    })
  }

  /**
   * Replace separator
   */
  replaceSeparator() {
    this.formWhiteSim.controls['lastStock'].setValue(this.formWhiteSim.controls['lastStock'].value?.replaceAll(',', '.') || '')
    this.formWhiteSim.controls['realCoverage'].setValue(this.formWhiteSim.controls['realCoverage'].value?.replaceAll(',', '.') || '')
    this.formWhiteSim.controls['totalIn'].setValue(this.formWhiteSim.controls['totalIn'].value?.replaceAll(',', '.') || '')
    this.formWhiteSim.controls['totalOut'].setValue(this.formWhiteSim.controls['totalOut'].value?.replaceAll(',', '.') || '')
    this.formWhiteSim.controls['etpMag'].setValue(this.formWhiteSim.controls['etpMag'].value?.replaceAll(',', '.') || '')
    this.formWhiteSim.controls['etpFon'].setValue(this.formWhiteSim.controls['etpFon'].value?.replaceAll(',', '.') || '')
    this.formWhiteSim.controls['realDTESInMonths'].setValue(this.formWhiteSim.controls['realDTESInMonths'].value?.replaceAll(',', '.') || '')

    this.formWhiteSim.controls['magRealTimePerCase'].setValue(this.formWhiteSim.controls['magRealTimePerCase'].value?.replaceAll(',', '.') || '')
  }

  /**
   * Validate no (no ?)
   * @param e
   * @returns
   */
  validateNo(e: any) {
    const charCode = e.which ? e.which : e.keyCode
    this.pressedKey = true
    if (charCode === 46 || charCode === 44) return true
    if (charCode > 31 && (charCode < 48 || charCode > 57)) {
      return false
    }
    return true
  }

  /**
   * On delete pressed
   * @param e
   */
  onDeletePressed(e: any) {
    const charCode = e.which ? e.which : e.keyCode
    if (charCode === 46 || charCode === 8) {
      this.pressedKey = true
    }
  }

  /**
   * Get start TMD
   * @returns
   */
  getStartTmd() {
    /**
    console.log(
      'getTmd',
      this.formWhiteSim.controls['magRealTimePerCase'].value,
      Number(this.formWhiteSim.controls['magRealTimePerCase'].value),
      this.formWhiteSim
    ); */
    return parseFloat(this.formWhiteSim.controls['magRealTimePerCase'].value || '0')
  }

  /**
   * Update time value
   * @param value
   */
  updateTimeValue(value: Number) {
    if (value !== 0) {
      this.pressedKey = true
      this.formWhiteSim.get('magRealTimePerCase')?.setValue(String(value))
      this.endSituationDisplay.magRealTimePerCase = String(value)
    }
    if (this.lockedParams.includes('magRealTimePerCase')) {
      const element = document.querySelector('#magRealTimePerCase')
      element?.classList.add('grey-bg-disabled')
      element?.setAttribute('disabled', 'disabled')
      this.disabledTmd = true
      this.defaultTmd = -1
    }
  }

  /**
   * Check if empty value
   * @returns
   */
  checkIfEmptyValue() {
    let counter = 0
    let infiniteValue = false

    for (const field in this.formWhiteSim.controls) {
      // 'field' is a string
      const control = this.formWhiteSim.get(field)?.value // 'control' is a FormControl
      if (['totalIn', 'totalOut'].includes(field) && control === '0') infiniteValue = true
      if (control === '') counter++
    }
    if (infiniteValue) return true
    return counter <= 2 ? false : true
  }

  /**
   * Check if empty counter
   * @returns
   */
  checkIfEmptyCounter() {
    let counter = 0
    for (const field in this.formWhiteSim.controls) {
      // 'field' is a string
      const control = this.formWhiteSim.get(field)?.value // 'control' is a FormControl
      if (control !== '') counter++
    }
    return counter
  }

  /**
   * Get tooltip text
   * @returns
   */
  getTooltipText() {
    return 'Dès que vous aurez saisi suffisamment de données pour que la situation de départ puisse être projetée, vous pourrez la valider afin d’effectuer une simulation. Veuillez saisir des données complémentaires pour que toutes les autres puissent être calculées automatiquement. Vous ne pouvez pas saisir de valeur égale à 0 pour les entrées ou les sorties.'
  }

  /**
   * Get Temps Moyen Par Dossier
   * @returns
   */
  getTmd() {
    return decimalToStringDate(this.getStartTmd(), ':')
  }

  /**
   * Troncage valeur numérique
   */
  trunc(val: string) {
    return Math.trunc(parseFloat(val) * 100000) / 100000
  }
}
