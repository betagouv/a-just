import { animate, style, transition, trigger } from '@angular/animations'
import { nbOfDays } from 'src/app/utils/dates'
import {
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core'
import { dataInterface } from 'src/app/components/select/select.component'
import { CalculatorInterface } from 'src/app/interfaces/calculator'
import { ContentieuReferentielInterface } from 'src/app/interfaces/contentieu-referentiel'
import { SimulatorInterface } from 'src/app/interfaces/simulator'
import { MainClass } from 'src/app/libs/main-class'
import { HumanResourceService } from 'src/app/services/human-resource/human-resource.service'
import { ReferentielService } from 'src/app/services/referentiel/referentiel.service'
import { SimulatorService } from 'src/app/services/simulator/simulator.service'
import { tree } from 'src/app/routes/simulator/simulator.tree'
import { forEach, result } from 'lodash'
import { ThisReceiver } from '@angular/compiler'
import { SimulationInterface } from 'src/app/interfaces/simulation'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import * as es6printJS from 'print-js'

@Component({
  templateUrl: './simulator.page.html',
  styleUrls: ['./simulator.page.scss'],
  animations: [
    trigger('fadeInOut', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate(500, style({ opacity: 1 })),
      ]),
      transition(':leave', [animate(500, style({ opacity: 0 }))]),
    ]),
  ],
})
export class SimulatorPage extends MainClass implements OnDestroy, OnInit {
  openPopup: boolean = false
  mooveClass: string = ''
  disabled: string = 'disabled'
  contentieuId: number | null = null
  subList: number[] = []
  formReferentiel: dataInterface[] = []
  firstSituationData: SimulatorInterface | null = null
  projectedSituationData: SimulatorInterface | null = null
  simulatedSationData: SimulationInterface | null = null
  referentiel: ContentieuReferentielInterface[] = []
  dateStart: Date = new Date()
  dateStop: Date | null = null
  today: Date = new Date()
  startRealValue: string = ''
  stopRealValue: string = ''
  nbOfMonthWithinPeriod: number[] = []
  buttonSelected: any = undefined
  resetPercentage: boolean = false
  valueToAjust = { value: '', percentage: null }
  currentNode: any | undefined = {}
  paramsToAjust = {
    param1: {
      label: '',
      value: '',
      percentage: null,
      input: 0,
      button: { value: '' },
    },
    param2: {
      label: '',
      value: '',
      percentage: null,
      input: 0,
      button: { value: '' },
    },
  }
  pickersParamsToLock = []
  paramsToLock = {
    param1: { label: '', value: '' },
    param2: { label: '', value: '' },
  }
  decisionTree = tree

  toSimulate: boolean = false
  toDisplaySimulation: boolean = false
  toDisplay = []
  toCalculate = []
  simulateButton = 'disabled'
  logger: string[] = []

  constructor(
    private humanResourceService: HumanResourceService,
    private referentielService: ReferentielService,
    private simulatorService: SimulatorService
  ) {
    super()
  }

  ngOnInit(): void {
    this.dateStop = null
    this.watch(
      this.humanResourceService.contentieuxReferentiel.subscribe((c) => {
        this.referentiel = c.filter(
          (r) =>
            this.referentielService.idsIndispo.indexOf(r.id) === -1 &&
            this.referentielService.idsSoutien.indexOf(r.id) === -1
        )
        this.formatReferenteil()
      })
    )

    this.watch(
      this.simulatorService.situationActuelle.subscribe((d) => {
        this.firstSituationData =
          this.simulatorService.situationActuelle.getValue()
      })
    )

    this.watch(
      this.simulatorService.situationProjected.subscribe((d) => {
        this.projectedSituationData =
          this.simulatorService.situationProjected.getValue()
      })
    )

    this.simulatorService.syncDatas(this.contentieuId)
  }

  ngOnDestroy() {}

  formatReferenteil() {
    this.formReferentiel = this.referentiel.map((r) => ({
      id: r.id,
      value: this.referentielMappingName(r.label),
      childrens: r.childrens?.map((s) => ({
        id: s.id,
        value: s.label,
        parentId: r.id,
      })),
    }))
  }

  updateReferentielSelected(type: string = '', event: any = null) {
    if (type === 'referentiel') {
      this.subList = []
      const fnd = this.referentiel.find((o) => o.id === event[0])
      fnd?.childrens?.map((value) => this.subList.push(value.id))
      this.contentieuId = event[0]
      this.simulatorService.contentieuOrSubContentieuId.next(
        this.contentieuId as number
      )
      this.disabled = ''
    } else if (type === 'subList') {
      this.subList = event
      const tmpRefLength = this.referentiel.find(
        (v) => v.id === this.contentieuId
      )
      if (event.length === tmpRefLength?.childrens?.length)
        this.simulatorService.contentieuOrSubContentieuId.next(
          this.contentieuId as number
        )
      else
        this.simulatorService.contentieuOrSubContentieuId.next(
          this.subList[0] as number
        )
      if (!event.length) this.disabled = 'disabled'
      else this.disabled = ''
    } else if (type === 'dateStart') {
      this.dateStart = new Date(event)
      this.nbOfMonthWithinPeriod = this.monthDiff(this.dateStart, this.dateStop)
      if (
        this.dateStart.getDate() !== this.today.getDate() ||
        this.dateStart.getMonth() !== this.today.getMonth() ||
        this.dateStart.getFullYear() !== this.today.getFullYear()
      )
        this.mooveClass = 'future'
      else if (this.dateStop === null) this.mooveClass = ''
      else this.mooveClass = 'present'
      this.disabled = 'disabled-date'
      this.simulatorService.dateStart.next(this.dateStart)
      this.startRealValue = this.findRealValue(this.dateStart)
    } else if (type === 'dateStop') {
      this.disabled = 'disabled-date'

      this.dateStop = new Date(event)
      if (
        this.dateStart.getDate() !== this.today.getDate() ||
        this.dateStart.getMonth() !== this.today.getMonth() ||
        this.dateStart.getFullYear() !== this.today.getFullYear()
      )
        this.mooveClass = 'future'
      else this.mooveClass = 'present'
      this.simulatorService.dateStop.next(this.dateStop)
      this.stopRealValue = this.findRealValue(this.dateStop)
      this.nbOfMonthWithinPeriod = this.monthDiff(this.dateStart, this.dateStop)
    }
  }

  monthDiff(dateFrom: Date, dateTo: Date | null): number[] {
    if (dateTo)
      return [
        ...Array(
          dateTo.getMonth() -
            dateFrom.getMonth() +
            12 * (dateTo.getFullYear() - dateFrom.getFullYear())
        ).keys(),
      ]
    else return []
  }

  getElementById(id: number | null) {
    return this.referentiel?.find((v) => v.id === id)
  }
  getFieldValue(
    param: string,
    data: SimulatorInterface | SimulationInterface | null,
    initialValue = false,
    toCompute = false
  ): any {
    if (
      (this.simulatorService.situationActuelle.getValue() !== null &&
        this.subList.length) ||
      !this.getElementById(this.contentieuId)?.childrens?.length
    ) {
      switch (param) {
        case 'etpMag':
          return data?.etpMag || '0'
        case 'totalOut':
          return data?.totalOut || '0'
        case 'totalIn':
          return data?.totalIn || '0'
        case 'lastStock':
          return data?.lastStock || '0'
        case 'etpFon':
          return ''
        case 'realCoverage': {
          if (data?.realCoverage && toCompute === true) {
            return Math.round(data?.realCoverage) || '0'
          } else if (data?.realCoverage && initialValue === true)
            return Math.round(data?.realCoverage) + '%' || '0'
          else if (data?.realCoverage)
            return Math.round(data?.realCoverage * 100) + '%' || '0'
          else return '0'
        }
        case 'realDTESInMonths':
          if (data?.realDTESInMonths && data?.realDTESInMonths !== Infinity) {
            return data?.realDTESInMonths + ' mois' || '0'
          }
          return '0'
        case 'realTimePerCase':
          if (initialValue) return data?.realTimePerCase || '0'
          else return this.decimalToStringDate(data?.realTimePerCase) || '0'
        case 'ETPTGreffe':
          return ''
      }
    }
    return ''
  }

  findRealValue(date: Date) {
    const today = new Date()
    if (
      today.getDate() === date.getDate() &&
      today.getMonth() === date.getMonth() &&
      today.getFullYear() === date.getFullYear()
    )
      return ''
    else if (date && typeof date.getMonth === 'function') {
      return `${(date.getDate() + '').padStart(
        2,
        '0'
      )} ${this.getShortMonthString(date)} ${date.getFullYear()}`
    } else return ''
  }

  resetParams() {
    this.contentieuId = null
    this.subList = []
    this.firstSituationData = null
    this.projectedSituationData = null
    this.dateStart = new Date()
    this.dateStop = null
    this.startRealValue = ''
    this.stopRealValue = ''
    this.mooveClass = ''
    document.getElementById('init-button')?.click()
    this.disabled = 'disabled'
    this.toDisplaySimulation = false
    this.toDisplay = []
    this.toCalculate = []
    this.logger = []
    this.simulateButton = 'disabled'
  }

  // get minimum date you can select on the date picker
  getMin(): Date {
    const date = new Date(this.dateStart)
    date.setDate(this.dateStart.getDate() + 1)
    return date
  }

  decimalToStringDate(decimal: number | null | undefined) {
    if (decimal != null) {
      const strArray = String(decimal).split('.')
      const decimalMinute =
        strArray[1] && +strArray[1].length === 1
          ? +strArray[1] * 10
          : +strArray[1]
      let minute = strArray[1]
        ? String(Math.ceil((1 / 100) * decimalMinute * 60))
        : '00'
      minute = minute.length === 1 ? '0' + minute : minute
      return strArray[0] + 'h' + minute
    }
    return
  }

  openPopupWithParams(button: any): void {
    this.buttonSelected = button
    const find = this.decisionTree.find((item) => item.label === button.id)

    if (this.paramsToAjust.param1.input === 0) this.currentNode = find
    this.openPopup = true
  }

  setParamsToAjust(volumeInput: any, inputField: any, allButton: any): void {
    // get list of params to ajust from the currentNode selected
    const paramsToAjust =
      this.paramsToAjust.param1.input === 0 && this.currentNode
        ? this.currentNode.toAjust.map((x: any) => x.label)
        : null

    // if param comming from input type volume
    if (
      volumeInput &&
      (parseFloat(volumeInput) !== 0 ||
        (this.buttonSelected.id === 'lastStock' &&
          parseFloat(volumeInput) === 0) ||
        (this.buttonSelected.id === 'realDTESInMonths' &&
          parseFloat(volumeInput) === 0)) &&
      parseFloat(volumeInput) >= 0
    ) {
      // if param 1 not filled yet or if param 1 selected to be edited
      if (
        !this.paramsToAjust.param1.value ||
        this.paramsToAjust.param1.label === inputField.id
      ) {
        this.paramsToAjust.param1.value = volumeInput
        this.paramsToAjust.param1.label = inputField.id
        this.paramsToAjust.param1.input = 1
        this.paramsToAjust.param1.button = inputField
        this.paramsToAjust.param1.percentage = null
        this.disabled = 'disabled-only-date'
        //else edit param 2
      } else {
        this.paramsToAjust.param2.value = volumeInput
        this.paramsToAjust.param2.label = inputField.id
        this.paramsToAjust.param2.input = 1
        this.paramsToAjust.param2.button = inputField
        this.paramsToAjust.param2.percentage = null

        // disable all buttons excepted those already filled
        allButton.map((x: any) => {
          if (
            x.id !== this.paramsToAjust.param1.label &&
            x.id !== this.paramsToAjust.param2.label
          ) {
            x.classList.add('disable')
          }
        })
      }
      // if param comming from input type %
    } else if (this.valueToAjust.percentage) {
      // if param 1 not filled yet or if param 1 selected to be edited
      if (
        this.paramsToAjust.param1.input === 0 ||
        this.paramsToAjust.param1.label === inputField.id
      ) {
        this.paramsToAjust.param1.value = this.valueToAjust.value
        this.paramsToAjust.param1.label = inputField.id
        this.paramsToAjust.param1.input = 2
        this.paramsToAjust.param1.button = inputField
        this.paramsToAjust.param1.percentage = this.valueToAjust.percentage
        this.disabled = 'disabled-only-date'
        //else edit param 2
      } else {
        this.paramsToAjust.param2.value = this.valueToAjust.value
        this.paramsToAjust.param2.label = inputField.id
        this.paramsToAjust.param2.input = 2
        this.paramsToAjust.param2.button = inputField
        this.paramsToAjust.param2.percentage = this.valueToAjust.percentage

        // disable all buttons excepted those already filled
        allButton.map((x: any) => {
          if (
            x.id !== this.paramsToAjust.param1.label &&
            x.id !== this.paramsToAjust.param2.label
          ) {
            x.classList.add('disable')
          }
        })
      }
      //else (no value filled in popup)
    } else {
      // if param1 reset =>  reset all params
      if (inputField.id === this.paramsToAjust.param1.label) {
        this.paramsToAjust.param1.value = ''
        this.paramsToAjust.param1.label = ''
        this.paramsToAjust.param1.input = 0
        this.paramsToAjust.param1.percentage = null
        this.paramsToAjust.param2.value = ''
        this.paramsToAjust.param2.label = ''
        this.paramsToAjust.param2.input = 0
        this.paramsToAjust.param2.percentage = null
        allButton.map((x: any) => {
          x.classList.remove('disable')
        })
        this.paramsToAjust.param2.button.value = 'Ajuster'
        this.currentNode = undefined
        this.disabled = 'disabled-date'
        // else if param2 reset =>  reset only param2
      } else if (inputField.id === this.paramsToAjust.param2.label) {
        this.paramsToAjust.param2.value = ''
        this.paramsToAjust.param2.label = ''
        this.paramsToAjust.param2.input = 0
        this.paramsToAjust.param2.percentage = null
        const param1ToAjust = this.currentNode.toAjust.map((x: any) => x.label)

        allButton.map((x: any) => {
          if (param1ToAjust && param1ToAjust.includes(x.id))
            x.classList.remove('disable')
        })
      }
    }

    // get 1 result from inputs
    let result = -1
    if (volumeInput !== '')
      result =
        parseFloat(volumeInput) === 0
          ? this.buttonSelected.id === 'lastStock'
            ? 0
            : this.buttonSelected.id === 'realDTESInMonths'
            ? 0
            : -1
          : parseFloat(volumeInput) >= 0
          ? parseFloat(volumeInput)
          : -1
    else if (
      this.valueToAjust.value !== '' &&
      String(this.valueToAjust.value) !== 'NaN'
    )
      result = parseInt(this.valueToAjust.value)

    // if result
    if (result > -1) {
      // affect the value to the editable input
      if (inputField.id === 'realTimePerCase' && result)
        inputField.value = this.decimalToStringDate(result)
      else if (inputField.id === 'realCoverage' && result)
        inputField.value = result + '%'
      else if (inputField.id === 'realDTESInMonths')
        inputField.value = result + ' mois'
      else inputField.value = result
      this.valueToAjust.value = ''

      allButton.map((x: any) => {
        if (
          paramsToAjust &&
          !paramsToAjust.includes(x.id) &&
          x.id !== inputField.id &&
          x.id !== paramsToAjust?.param1?.label &&
          x.id !== paramsToAjust?.param2?.label
        )
          x.classList.add('disable')
      })
      // else (no value edited) reset the input to 'Ajuster'
    } else inputField.value = 'Ajuster'
    //close the popup
    this.openPopup = false

    this.valueToAjust = { value: '', percentage: null }
    if (
      this.paramsToAjust.param1.input !== 0 ||
      this.paramsToAjust.param2.input !== 0
    )
      this.simulateButton = ''
  }

  onUpdateValueToAjust(event: any) {
    //only if percentage filled
    if (event.value === 0) {
      if (
        this.buttonSelected.id === 'lastStock' ||
        this.buttonSelected.id === 'realDTESInMonths'
      )
        this.valueToAjust = event
      else this.valueToAjust = { value: '', percentage: null }
    } else this.valueToAjust = event
  }

  valueSaved(input: number): string {
    // if input type volume (quantity)
    if (input === 1) {
      if (this.buttonSelected.id === this.paramsToAjust.param1.label)
        return this.paramsToAjust.param1.input === 1
          ? this.paramsToAjust.param1.value
          : ''
      else
        return this.paramsToAjust.param2.input === 1
          ? this.paramsToAjust.param2.value
          : ''
      // if input type percentage (%)
    } else if (input === 2) {
      if (this.buttonSelected.id === this.paramsToAjust.param1.label)
        return this.paramsToAjust.param1.input === 2 &&
          this.paramsToAjust.param1.percentage !== null
          ? String(this.paramsToAjust.param1.percentage)
          : ''
      else
        return this.paramsToAjust.param2.input === 2 &&
          this.paramsToAjust.param2.percentage !== null
          ? String(this.paramsToAjust.param2.percentage)
          : ''
    }
    return ''
  }

  percentageModifiedInputText(
    id: string,
    projectedValue: string | number | undefined
  ) {
    if (id === 'realTimePerCase' && projectedValue === -100) return ''
    if (
      id === 'realCoverage' &&
      this.paramsToAjust.param1.label === 'realCoverage'
    )
      return this.percantageWithSign(
        parseFloat(this.paramsToAjust.param1.value) -
          parseFloat(projectedValue as string)
      )
    if (
      id === 'realCoverage' &&
      this.paramsToAjust.param2.label === 'realCoverage'
    )
      return this.percantageWithSign(
        parseFloat(this.paramsToAjust.param2.value) -
          parseFloat(projectedValue as string)
      )

    return this.paramsToAjust.param1.label === id
      ? this.percantageWithSign(this.paramsToAjust.param1.percentage)
        ? this.percantageWithSign(this.paramsToAjust.param1.percentage)
        : this.ratio(this.paramsToAjust.param1.value, projectedValue as string)
      : this.percantageWithSign(this.paramsToAjust.param2.percentage)
      ? this.percantageWithSign(this.paramsToAjust.param2.percentage)
      : this.ratio(this.paramsToAjust.param2.value, projectedValue as string)
  }

  percantageWithSign(value: number | null) {
    return value && value >= 0 ? '+' + value : value
  }

  ratio(result: string, initialValue: string) {
    const roundedValue =
      Math.round(
        (((parseFloat(result) - parseFloat(initialValue)) * 100) /
          parseFloat(initialValue as string)) *
          100
      ) / 100
    return roundedValue >= 0 ? '+' + roundedValue : roundedValue
  }
  calculCoverage(value1: number, value2: number) {
    return value1 - value2
  }
  getReferenceValue(value: any) {
    return parseInt(value)
  }

  initParams(buttons: any) {
    this.disabled = 'disabled-date'
    this.toDisplaySimulation = false
    buttons.forEach((x: any) => {
      x.value = 'Ajuster'
      x.classList.remove('disable')
    })
    this.paramsToAjust = {
      param1: {
        label: '',
        value: '',
        percentage: null,
        input: 0,
        button: { value: '' },
      },
      param2: {
        label: '',
        value: '',
        percentage: null,
        input: 0,
        button: { value: '' },
      },
    }
    this.logger = []
    this.simulateButton = 'disabled'

    this.toDisplay = []
    this.toCalculate = []
    this.pickersParamsToLock = []
    this.paramsToLock = {
      param1: { label: '', value: '' },
      param2: { label: '', value: '' },
    }
  }

  getText(label: string): string {
    if (label === 'title') {
      if (
        this.buttonSelected.id === this.paramsToAjust.param1.label ||
        this.paramsToAjust.param1.input === 0
      )
        return this.currentNode.popupTitle
      else
        return this.currentNode.toAjust.find(
          (x: any) => x.label === this.buttonSelected.id
        ).popupTitle
    } else if (label === 'firstInput') {
      if (
        this.buttonSelected.id === this.paramsToAjust.param1.label ||
        this.paramsToAjust.param1.input === 0
      )
        return this.currentNode.toDefine[0]
      else
        return this.currentNode.toAjust.find(
          (x: any) => x.label === this.buttonSelected.id
        ).toDefine[0]
    } else if (label === 'secondInput') {
      if (
        this.buttonSelected.id === this.paramsToAjust.param1.label ||
        this.paramsToAjust.param1.input === 0
      )
        return this.currentNode.toDefine[1]
      else
        return this.currentNode.toAjust.find(
          (x: any) => x.label === this.buttonSelected.id
        ).toDefine[1]
    }
    return ''
  }

  getNbOfParams(): number {
    if (
      this.buttonSelected.id === this.paramsToAjust.param1.label ||
      this.paramsToAjust.param1.input === 0
    )
      return this.currentNode.toDefine.length
    else
      return this.currentNode.toAjust.find(
        (x: any) => x.label === this.buttonSelected.id
      ).toDefine.length
  }

  valueChange(button: any, event: any) {
    if (this.buttonSelected.id === 'realTimePerCase' && event === 0)
      button.value = 'Ajuster'
    else button.value = event
  }

  parseFloat(value: string): number {
    if (value !== '') return parseFloat(value)
    else return 0
  }

  simulate(allButton: any): void {
    if (
      this.paramsToAjust.param1.input !== 0 &&
      this.paramsToAjust.param2.input !== 0
    ) {
      const find = this.currentNode.toAjust.find(
        (x: any) => x.label === this.paramsToAjust.param2.label
      ).toSimulate

      if (find.length > 1) {
        this.pickersParamsToLock = find.map((obj: any) => obj.locked)
        this.toSimulate = true
      } else {
        this.toSimulate = false
        this.toDisplaySimulation = true
        this.toDisplay = find[0].toDisplay
        this.toCalculate = find[0].toCalculate
        //console.log('1 compute', this.toDisplay, this.toCalculate) //done

        //compute ! no popup
        this.computeSimulation()
        allButton.map((x: any) => {
          x.classList.add('disable')
        })
        this.simulateButton = 'disabled'
      }
    } else if (
      this.paramsToAjust.param1.input !== 0 &&
      this.paramsToAjust.param2.input === 0
    ) {
      if (this.currentNode.toSimulate.length > 1) {
        this.pickersParamsToLock = this.currentNode.toSimulate.map(
          (obj: any) => obj.locked
        )
        this.toSimulate = true
      } else {
        this.toSimulate = false
        this.toDisplaySimulation = true
        this.toDisplay = this.currentNode.toSimulate[0].toDisplay
        this.toCalculate = this.currentNode.toSimulate[0].toCalculate
        //console.log('2 compute', this.toDisplay, this.toCalculate) //done

        //compute ! no popup
        this.computeSimulation()
        allButton.map((x: any) => {
          x.classList.add('disable')
        })
        this.simulateButton = 'disabled'
      }
    }
  }

  getLockedParamLabel(paramNumber: number): string {
    if (this.pickersParamsToLock.length > 0)
      return this.getLabelTranslation(this.pickersParamsToLock[paramNumber])
    return ''
  }

  selectParamToLock(paramNumber: number, allButton: any) {
    if (this.paramsToLock.param1.label === '') {
      this.paramsToLock.param1.label = this.pickersParamsToLock[paramNumber]
      this.paramsToLock.param1.value = this.firstSituationData
        ? this.firstSituationData[this.pickersParamsToLock[paramNumber]]
        : ''

      if (this.paramsToAjust.param2.input === 0) {
        const find = this.currentNode.toSimulate.find(
          (x: any) => x.locked === this.paramsToLock.param1.label
        )

        const objSecond =
          find && find.secondLocked
            ? find.secondLocked.map((obj: any) => obj.locked)
            : null

        if (objSecond !== null) {
          this.pickersParamsToLock = objSecond
        } else {
          this.toSimulate = false
          this.toDisplaySimulation = true
          this.toDisplay = find.toDisplay
          this.toCalculate = find.toCalculate
          //console.log('3 compute', this.toDisplay, this.toCalculate) //done

          //compute !
          this.computeSimulation()
          allButton.map((x: any) => {
            x.classList.add('disable')
          })
          this.simulateButton = 'disabled'
        }
      } else {
        const find = this.currentNode.toAjust.find(
          (x: any) => x.label === this.paramsToAjust.param2.label
        )
        const objSecond =
          find && find.secondLocked
            ? find.secondLocked.map((obj: any) => obj.locked)
            : null

        if (objSecond !== null) {
          this.pickersParamsToLock = objSecond
        } else {
          const lastObj = find.toSimulate.find(
            (x: any) => x.locked === this.pickersParamsToLock[paramNumber]
          )
          this.toSimulate = false
          this.toDisplaySimulation = true
          this.toDisplay = lastObj.toDisplay
          this.toCalculate = lastObj.toCalculate
          //console.log('4 compute', this.toDisplay, this.toCalculate)
          //compute !
          this.computeSimulation()
          allButton.map((x: any) => {
            x.classList.add('disable')
          })
          this.simulateButton = 'disabled'
        }
      }
    } else if (this.paramsToLock.param2.label === '') {
      this.paramsToLock.param2.label = this.pickersParamsToLock[paramNumber]

      this.paramsToLock.param2.value = this.firstSituationData
        ? this.firstSituationData[this.pickersParamsToLock[paramNumber]]
        : ''

      this.toSimulate = false
      this.toDisplaySimulation = true
      if (
        this.paramsToAjust.param1.input !== 0 &&
        this.paramsToAjust.param2.input === 0
      ) {
        const find = this.currentNode.toSimulate.find(
          (x: any) => x.locked === this.paramsToLock.param1.label
        )
        const objSecond =
          find && find.secondLocked
            ? find.secondLocked.find(
                (obj: any) =>
                  obj.locked === this.pickersParamsToLock[paramNumber]
              )
            : null
        if (objSecond) {
          this.toDisplay = objSecond.toDisplay
          this.toCalculate = objSecond.toCalculate
          //console.log('5 compute', this.toDisplay, this.toCalculate) // done
          //compute !
          this.computeSimulation()
          allButton.map((x: any) => {
            x.classList.add('disable')
          })
          this.simulateButton = 'disabled'
        } else {
          this.toDisplay = find.toDisplay
          this.toCalculate = find.toCalculate
          //console.log('6 compute', this.toDisplay, this.toCalculate)
          //compute !
          this.computeSimulation()
          allButton.map((x: any) => {
            x.classList.add('disable')
          })
          this.simulateButton = 'disabled'
        }
      } else if (
        this.paramsToAjust.param1.input !== 0 &&
        this.paramsToAjust.param2.input !== 0
      ) {
        const find = this.currentNode.toAjust.find(
          (x: any) => x.label === this.paramsToAjust.param2.label
        )
        if (find && find.secondLocked) {
          const objSecond = find.secondLocked.find(
            (obj: any) => obj.locked === this.pickersParamsToLock[paramNumber]
          )
          this.toDisplay = objSecond.toDisplay
          this.toCalculate = objSecond.toCalculate
          //console.log('7 compute', this.toDisplay, this.toCalculate)
          //compute !
          this.computeSimulation()
          allButton.map((x: any) => {
            x.classList.add('disable')
          })
          this.simulateButton = 'disabled'
        } else {
          this.toSimulate = false
          this.toDisplaySimulation = true
          this.toDisplay = find.toDisplay
          this.toCalculate = find.toCalculate
          //console.log('8 compute', this.toDisplay, this.toCalculate)
          //compute !
          this.computeSimulation()
          allButton.map((x: any) => {
            x.classList.add('disable')
          })
          this.simulateButton = 'disabled'
        }
      }
    }
  }

  getLabelTranslation(value: string): string {
    switch (value) {
      case 'etpMag':
        return 'ETPT magistrat'
      case 'totalIn':
        return 'entrées mensuelles'
      case 'totalOut':
        return 'sorties mensuelles'
      case 'lastStock':
        return 'stock'
      case 'realDTESInMonths':
        return 'DTES'
      case 'realCoverage':
        return 'taux de couverture'
      case 'realTimePerCase':
        return 'temps moyen par dossier'
    }
    return ''
  }

  computeSimulation() {
    const params = {
      beginSituation: this.firstSituationData,
      endSituation: this.projectedSituationData,
      lockedParams: this.paramsToLock,
      modifiedParams: this.paramsToAjust,
      toDisplay: this.toDisplay,
      toCalculate: this.toCalculate,
    }
    const simulation: SimulationInterface = {
      totalIn: null,
      totalOut: null,
      lastStock: null,
      etpMag: null,
      realTimePerCase: null,
      realDTESInMonths: null,
      realCoverage: null,
    }

    //console.log('big P', params)

    this.toDisplay.map((x) => {
      if (params.beginSituation !== null)
        simulation[x] = params.beginSituation[x]
    })

    if (
      params.lockedParams.param1.label !== '' &&
      simulation.hasOwnProperty(params.lockedParams.param1.label)
    )
      //@ts-ignore
      simulation[params.lockedParams.param1.label] =
        params.lockedParams.param1.label === 'realCoverage'
          ? parseFloat(params.lockedParams.param1.value) / 100
          : parseFloat(params.lockedParams.param1.value)
    if (
      params.lockedParams.param2.label !== '' &&
      simulation.hasOwnProperty(params.lockedParams.param2.label)
    )
      //@ts-ignore
      simulation[params.lockedParams.param2.label] =
        params.lockedParams.param2.label === 'realCoverage'
          ? parseFloat(params.lockedParams.param2.value) / 100
          : parseFloat(params.lockedParams.param2.value)

    if (params.modifiedParams.param1.input !== 0)
      //@ts-ignore
      simulation[params.modifiedParams.param1.label] =
        params.modifiedParams.param1.label === 'realCoverage'
          ? parseFloat(params.modifiedParams.param1.value) / 100
          : parseFloat(params.modifiedParams.param1.value)

    if (params.modifiedParams.param2.input !== 0)
      //@ts-ignore
      simulation[params.modifiedParams.param2.label] =
        params.modifiedParams.param2.label === 'realCoverage'
          ? parseFloat(params.modifiedParams.param2.value) / 100
          : parseFloat(params.modifiedParams.param2.value)

    if (params.modifiedParams.param1.label)
      this.logger.push(
        'Paramètre modifié 1:  ' +
          params.modifiedParams.param1.label +
          ' => ' +
          params.modifiedParams.param1.value
      )
    if (params.modifiedParams.param2.label)
      this.logger.push(
        'Paramètre modifié 2:  ' +
          params.modifiedParams.param2.label +
          ' => ' +
          params.modifiedParams.param2.value
      )
    if (params.lockedParams.param1.label)
      this.logger.push(
        'Paramètre bloqué 1:  ' +
          params.lockedParams.param1.label +
          ' => ' +
          params.lockedParams.param1.value
      )
    if (params.lockedParams.param2.label)
      this.logger.push(
        'Paramètre bloqué 2:  ' +
          params.lockedParams.param2.label +
          ' => ' +
          params.lockedParams.param2.value
      )
    this.logger.push('Valeur à afficher:  ' + String(params.toDisplay))
    this.logger.push('Valeur à calculer:  ' + String(params.toCalculate))
    this.logger.push('_')
    this.logger.push(' ')
    this.logger.push('Début du calcul par étape: ')
    this.logger.push('_')

    this.logger.push('Valeur du coverage: ' + simulation.realCoverage)
    this.logger.push('_')

    let counter = 0
    do {
      counter++
      this.toCalculate.map((x) => {
        if (x === 'totalIn') {
          if (
            simulation.totalOut &&
            (simulation.lastStock || simulation.lastStock === 0)
          ) {
            this.logger.push(
              'step =>  (totalIn) | totalOut => ' +
                String(simulation.totalOut) +
                ' && lastStock => ' +
                String(simulation.lastStock)
            )
            simulation.totalIn = Math.floor(
              (Math.floor(simulation.lastStock) -
                Math.floor(params.beginSituation?.lastStock as number)) /
                (nbOfDays(
                  this.simulatorService.dateStart.value,
                  this.simulatorService.dateStop.value
                ) /
                  (365 / 12)) +
                Math.floor(simulation.totalOut)
            )
          } else if (simulation.totalOut && simulation.realCoverage) {
            this.logger.push(
              'step =>  (totalIn) |  totalOut => ' +
                String(Math.floor(simulation.totalOut)) +
                ' && realCoverage => ' +
                String(Math.floor(simulation.realCoverage))
            )
            simulation.totalIn = Math.floor(
              Math.floor(simulation.totalOut) / simulation.realCoverage
            )
          }
        }
        if (x === 'totalOut') {
          if (simulation.etpMag && simulation.realTimePerCase) {
            this.logger.push(
              'step =>  (totalOut) | etpMag => ' +
                String(simulation.etpMag) +
                ' && realTimePerCase => ',
              String(simulation.realTimePerCase)
            )
            simulation.totalOut = Math.floor(
              Math.floor(simulation.etpMag * 8 * 17.3333) /
                simulation.realTimePerCase
            )
          } else if (
            simulation.totalIn &&
            (simulation.lastStock || simulation.lastStock === 0)
          ) {
            this.logger.push(
              'step =>  (totalOut) | totalIn => ' +
                String(simulation.totalIn) +
                ' && lastStock => ' +
                String(simulation.lastStock) +
                ' Calcul différence de stock' +
                String(
                  Math.floor(
                    Math.floor(params.beginSituation?.lastStock as number) -
                      Math.floor(simulation.lastStock)
                  )
                ) +
                ' Begin situation: ' +
                String(Math.floor(params.beginSituation?.lastStock as number))
            )

            simulation.totalOut = Math.floor(
              Math.floor(
                Math.floor(params.beginSituation?.lastStock as number) -
                  Math.floor(simulation.lastStock)
              ) /
                (nbOfDays(
                  this.simulatorService.dateStart.value,
                  this.simulatorService.dateStop.value
                ) /
                  (365 / 12)) +
                simulation.totalIn
            )
          } else if (
            simulation.lastStock &&
            (simulation.realDTESInMonths || simulation.realDTESInMonths === 0)
          ) {
            this.logger.push(
              'step =>  (totalOut) | lastStock => ' +
                String(simulation.lastStock) +
                ' && realDTESInMonths => ' +
                String(simulation.realDTESInMonths)
            )

            simulation.totalOut = Math.floor(
              simulation.lastStock / simulation.realDTESInMonths
            )
          } else if (simulation.realCoverage && simulation.totalIn) {
            this.logger.push(
              'step =>  (totalOut) | realCoverage => ' +
                String(simulation.realCoverage) +
                ' && totalIn => ' +
                String(simulation.totalIn)
            )

            simulation.totalOut = Math.floor(
              simulation.realCoverage * simulation.totalIn
            )
          } else if (
            (simulation.realDTESInMonths ||
              simulation.realDTESInMonths === 0) &&
            simulation.totalIn
          ) {
            this.logger.push(
              'step =>  (totalOut) | realDTESInMonths => ' +
                String(simulation.realDTESInMonths) +
                ' && totalIn => ' +
                String(simulation.totalIn)
            )

            simulation.totalOut = Math.floor(
              (Math.floor(params.beginSituation?.lastStock as number) +
                simulation.totalIn *
                  (nbOfDays(
                    this.simulatorService.dateStart.value,
                    this.simulatorService.dateStop.value
                  ) /
                    (365 / 12))) /
                (simulation.realDTESInMonths +
                  nbOfDays(
                    this.simulatorService.dateStart.value,
                    this.simulatorService.dateStop.value
                  ) /
                    (365 / 12))
            )
          }
        }
        if (x === 'lastStock') {
          if (simulation.realDTESInMonths === 0) {
            simulation.lastStock = 0
          } else if (simulation.totalIn && simulation.totalOut) {
            this.logger.push(
              'step =>  (lastStock) | totalIn => ' +
                String(simulation.totalIn) +
                ' && totalOut => ' +
                String(simulation.totalOut)
            )
            simulation.lastStock = Math.floor(
              Math.floor(
                Math.floor(params.beginSituation?.lastStock as number) +
                  Math.floor(simulation.totalIn) *
                    (nbOfDays(
                      this.simulatorService.dateStart.value,
                      this.simulatorService.dateStop.value
                    ) /
                      (365 / 12)) -
                  Math.floor(simulation.totalOut) *
                    (nbOfDays(
                      this.simulatorService.dateStart.value,
                      this.simulatorService.dateStop.value
                    ) /
                      (365 / 12))
              )
            )
          } else if (
            (simulation.realDTESInMonths ||
              simulation.realDTESInMonths === 0) &&
            simulation.totalOut
          ) {
            this.logger.push(
              'step =>  (lastStock) | realDTESInMonths => ' +
                String(simulation.realDTESInMonths) +
                ' && totalOut => ' +
                String(simulation.totalOut)
            )
            simulation.lastStock = Math.floor(
              simulation.realDTESInMonths * Math.floor(simulation.totalOut)
            )
          }
          if (simulation.lastStock && simulation.lastStock < 0) {
            simulation.lastStock = 0
          }
        }
        if (x === 'realCoverage') {
          if (simulation.totalOut && simulation.totalIn) {
            this.logger.push(
              'step =>  (realCoverage) | totalOut => ' +
                String(simulation.totalOut) +
                (simulation.totalOut ? ' calculated ' : ' endSituation '),
              ' && totalIn | => ' +
                String(simulation.totalIn) +
                (simulation.totalIn
                  ? ' calculated ' + simulation.totalIn
                  : ' endSituation ' + simulation.totalIn)
            )

            simulation.realCoverage =
              (simulation.totalOut ||
                (params.endSituation?.totalOut as number)) /
              (simulation.totalIn || (params.endSituation?.totalIn as number))
          }
        }
        if (x === 'realDTESInMonths') {
          this.logger.push(
            'step =>  (realDTESInMonths) | lastStock => ' +
              String(simulation.lastStock) +
              (simulation.lastStock ? ' calculated ' : ' endSituation ') +
              ' && totalOut => ' +
              String(simulation.totalOut) +
              (simulation.totalOut ? ' calculated ' : ' endSituation ')
          )
          simulation.realDTESInMonths =
            Math.round(
              (Math.floor(simulation.lastStock || 0) /
                Math.floor(
                  simulation.totalOut ||
                    (params.endSituation?.totalOut as number)
                )) *
                100
            ) / 100
        }

        if (x === 'realTimePerCase') {
          this.logger.push(
            'step =>  (realTimePerCase) | etpPeriod => ' +
              String(params.endSituation?.etpToCompute as number) +
              ' && totalOut => ' +
              String(simulation.totalOut) +
              (simulation.totalOut ? ' calculated ' : ' endSituation ')
          )
          simulation.realTimePerCase =
            Math.round(
              ((17.333 *
                8 *
                (simulation.etpMag ||
                  (params.beginSituation?.etpMag as number))) /
                Math.floor(
                  simulation.totalOut ||
                    (params.endSituation?.totalOut as number)
                )) *
                100
            ) / 100
        }

        if (x === 'etpMag') {
          this.logger.push(
            'step =>  (etpMag) | etpPeriod => ' +
              String(simulation.realTimePerCase) +
              (simulation.realTimePerCase ? ' calculated ' : ' endSituation ') +
              ' && totalOut => ' +
              String(simulation.totalOut) +
              (simulation.totalOut ? ' calculated ' : ' endSituation ')
          )

          simulation.etpMag =
            Math.round(
              (((simulation.realTimePerCase ||
                (params.endSituation?.realTimePerCase as number)) *
                Math.floor(
                  simulation.totalOut ||
                    (params.endSituation?.totalOut as number)
                )) /
                (17.333 * 8)) *
                100
            ) / 100
        }
      })
    } while (
      !(
        simulation.totalIn !== null &&
        simulation.totalOut !== null &&
        simulation.lastStock !== null &&
        simulation.etpMag !== null &&
        simulation.realTimePerCase !== null &&
        simulation.realDTESInMonths !== null &&
        simulation.realCoverage !== null
      )
    )
    this.logger.push('_')
    //if (counter > 1) this.logger.push('WRONG order')
    //console.log('big R', simulation)
    this.simulatedSationData = simulation
  }

  onKeypressEvent(
    event: any,
    volumeInput: any,
    inputField: any,
    allButton: any
  ) {
    if (event.which === 13) {
      this.setParamsToAjust(volumeInput, inputField, allButton)
    }
  }

  /**
    html2canvas(element!, {
      scale: 2,
      scrollY: -window.scrollY,
    }).then(async (canvas) => {
      var width = element.offsetWidth
      var height = element.offsetHeight

      var pdf = new jsPDF('l', 'px', [height, width / 2])

      pdf.addImage(
        canvas.toDataURL('image/png', 1),
        'png',
        0,
        0,
        width / 2,
        height / 2
      )
      pdf.save('fichier.pdf', { returnPromise: true })
    })
 */

  async print() {
    const filename = 'ThisIsYourPDFFilename.pdf'
    let element: any = document.getElementById('content')!
    //element = element.cloneNode(true)
    const currentScroll = element.scrollTop

    console.log(element)
    element.scrollTo(0, 0)

    //window.print()
    //return
    html2canvas(element!, {
      scale: 2,
    })
      .then((canvas) => {
        var width = element.offsetWidth
        var height = element.offsetHeight

        var doc = new jsPDF(
          'p',
          'px',
          [width / 2, element.scrollHeight / 2],
          true
        )

        element.scrollTo(0, 0)

        doc.addImage(
          canvas.toDataURL('image/png', 1),
          'png',
          0,
          0,
          width / 2,
          height / 2
        )

        element.scrollTo(0, height)

        html2canvas(element!, {
          scale: 2,
        }).then((canvas2) => {
          doc.addImage(
            canvas2.toDataURL('image/png', 1),
            'png',
            0,
            height / 2,
            width / 2,
            height / 2
          )

          element.scrollTo(0, height * 2)

          html2canvas(element!, {
            scale: 2,
          }).then((canvas3) => {
            doc.addImage(
              canvas3.toDataURL('image/png', 1),
              'png',
              0,
              height / 2 + (element.scrollHeight - 2 * height) / 2,
              width / 2,
              height / 2
            )

            doc.save(filename)
          })

          //doc.save(filename)
        })

        //element.scrollTo(0, currentScroll)
        return doc
        //element.style.overflow = 'hidden'
      })
      .then((doc) => {})
  }
}
