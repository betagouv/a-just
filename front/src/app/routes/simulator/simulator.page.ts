import { animate, style, transition, trigger } from '@angular/animations'
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
    referentiel: ContentieuReferentielInterface[] = []
    dateStart: Date = new Date()
    dateStop: Date | null = null
    today: Date = new Date()
    startRealValue: string = ''
    stopRealValue: string = ''
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
                        this.referentielService.idsIndispo.indexOf(r.id) ===
                            -1 &&
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
            if (
                this.dateStart.getDate() !== this.today.getDate() ||
                this.dateStart.getMonth() !== this.today.getMonth() ||
                this.dateStart.getFullYear() !== this.today.getFullYear()
            )
                this.mooveClass = 'future'
            else this.mooveClass = ''
            this.disabled = 'disabled-date'
            this.simulatorService.dateStart.next(this.dateStart)
            this.startRealValue = this.findRealValue(this.dateStart)
        } else if (type === 'dateStop') {
            this.disabled = 'disabled-date'

            this.dateStop = new Date(event)
            this.simulatorService.dateStop.next(this.dateStop)
            this.stopRealValue = this.findRealValue(this.dateStop)
        }
    }

    getElementById(id: number | null) {
        return this.referentiel?.find((v) => v.id === id)
    }
    getFieldValue(
        param: string,
        data: SimulatorInterface | null,
        initialValue = false
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
                    if (data?.realCoverage)
                        return Math.trunc(data?.realCoverage * 100) + '%' || '0'
                    else return '0'
                }
                case 'realDTESInMonths':
                    if (
                        data?.realDTESInMonths &&
                        data?.realDTESInMonths !== Infinity
                    ) {
                        return data?.realDTESInMonths + ' mois' || '0'
                    }
                    return '0'
                case 'realTimePerCase':
                    if (initialValue) return data?.realTimePerCase || '0'
                    else
                        return (
                            this.decimalToStringDate(data?.realTimePerCase) ||
                            '0'
                        )
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
        console.log(this.currentNode)
    }

    setParamsToAjust(volumeInput: any, inputField: any, allButton: any): void {
        // get list of params to ajust from the currentNode selected
        const paramsToAjust =
            this.paramsToAjust.param1.input === 0 && this.currentNode
                ? this.currentNode.toAjust.map((x: any) => x.label)
                : null
        console.log(
            'volume',
            volumeInput,
            'percent',
            this.valueToAjust.percentage,
            'parse',
            this.valueToAjust.value,
            parseInt(this.valueToAjust.value)
        )
        // if param comming from input type volume
        if (
            volumeInput &&
            (parseFloat(volumeInput) !== 0 ||
                (this.buttonSelected.id === 'lastStock' &&
                    parseFloat(volumeInput) === 0))
        ) {
            console.log('first if')
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
            console.log('second if', this.paramsToAjust.param1.value)

            // if param 1 not filled yet or if param 1 selected to be edited
            if (
                this.paramsToAjust.param1.input === 0 ||
                this.paramsToAjust.param1.label === inputField.id
            ) {
                console.log('third if')

                this.paramsToAjust.param1.value = this.valueToAjust.value
                this.paramsToAjust.param1.label = inputField.id
                this.paramsToAjust.param1.input = 2
                this.paramsToAjust.param1.button = inputField
                this.paramsToAjust.param1.percentage =
                    this.valueToAjust.percentage
                this.disabled = 'disabled-only-date'
                //else edit param 2
            } else {
                console.log('fourth if')

                this.paramsToAjust.param2.value = this.valueToAjust.value
                this.paramsToAjust.param2.label = inputField.id
                this.paramsToAjust.param2.input = 2
                this.paramsToAjust.param2.button = inputField
                this.paramsToAjust.param2.percentage =
                    this.valueToAjust.percentage

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
            // if param1 reset => reset all params
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
                // else if param2 reset => reset only param2
            } else if (inputField.id === this.paramsToAjust.param2.label) {
                this.paramsToAjust.param2.value = ''
                this.paramsToAjust.param2.label = ''
                this.paramsToAjust.param2.input = 0
                this.paramsToAjust.param2.percentage = null
                const param1ToAjust = this.currentNode.toAjust.map(
                    (x: any) => x.label
                )

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
                        : -1
                    : parseFloat(volumeInput)
        else if (
            this.valueToAjust.value !== '' &&
            String(this.valueToAjust.value) !== 'NaN'
        )
            result = parseInt(this.valueToAjust.value)

        // if result
        if (result !== -1) {
            // affect the value to the editable input
            if (inputField.id === 'realTimePerCase' && result)
                inputField.value = this.decimalToStringDate(result)
            else if (inputField.id === 'realCoverage' && result)
                inputField.value = result + '%'
            else if (inputField.id === 'realDTESInMonths' && result)
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

        console.log('this.paramsToAjust', this.paramsToAjust)
        this.valueToAjust = { value: '', percentage: null }
    }

    onUpdateValueToAjust(event: any) {
        //only if percentage filled
        if (event.value === 0) {
            if (this.buttonSelected.id === 'lastStock')
                this.valueToAjust = event
            else this.valueToAjust = { value: '', percentage: null }
        } else this.valueToAjust = event
        console.log('vevent', event)
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
        if (id === 'realCoverage')
            return this.percantageWithSign(
                parseFloat(this.paramsToAjust.param1.value) -
                    parseFloat(projectedValue as string)
            )
        return this.paramsToAjust.param1.label === id
            ? this.percantageWithSign(this.paramsToAjust.param1.percentage)
                ? this.percantageWithSign(this.paramsToAjust.param1.percentage)
                : this.ratio(
                      this.paramsToAjust.param1.value,
                      projectedValue as string
                  )
            : this.percantageWithSign(this.paramsToAjust.param2.percentage)
            ? this.percantageWithSign(this.paramsToAjust.param2.percentage)
            : this.ratio(
                  this.paramsToAjust.param2.value,
                  projectedValue as string
              )
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
                ).label
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

    simulate(): void {
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
            }
        }
    }

    getLockedParamLabel(paramNumber: number): string {
        if (this.pickersParamsToLock.length > 0)
            return this.pickersParamsToLock[paramNumber]
        return ''
    }

    selectParamToLock(paramNumber: number) {
        if (this.paramsToLock.param1.label === '') {
            this.paramsToLock.param1.label =
                this.pickersParamsToLock[paramNumber]
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
                        (x: any) =>
                            x.locked === this.pickersParamsToLock[paramNumber]
                    )
                    this.toSimulate = false
                    this.toDisplaySimulation = true
                    this.toDisplay = lastObj.toDisplay
                    this.toCalculate = lastObj.toCalculate
                    //console.log('4 compute', this.toDisplay, this.toCalculate)
                    //compute !
                    this.computeSimulation()
                }
            }
        } else if (this.paramsToLock.param2.label === '') {
            this.paramsToLock.param2.label =
                this.pickersParamsToLock[paramNumber]

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
                                  obj.locked ===
                                  this.pickersParamsToLock[paramNumber]
                          )
                        : null
                if (objSecond) {
                    this.toDisplay = objSecond.toDisplay
                    this.toCalculate = objSecond.toCalculate
                    //console.log('5 compute', this.toDisplay, this.toCalculate) // done
                    //compute !
                    this.computeSimulation()
                } else {
                    this.toDisplay = find.toDisplay
                    this.toCalculate = find.toCalculate
                    //console.log('6 compute', this.toDisplay, this.toCalculate)
                    //compute !
                    this.computeSimulation()
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
                        (obj: any) =>
                            obj.locked === this.pickersParamsToLock[paramNumber]
                    )
                    this.toDisplay = objSecond.toDisplay
                    this.toCalculate = objSecond.toCalculate
                    console.log('7 compute', this.toDisplay, this.toCalculate)
                    //compute !
                    this.computeSimulation()
                } else {
                    this.toSimulate = false
                    this.toDisplaySimulation = true
                    this.toDisplay = find.toDisplay
                    this.toCalculate = find.toCalculate
                    console.log('8 compute', this.toDisplay, this.toCalculate)
                    //compute !
                    this.computeSimulation()
                }
            }
        }
    }

    computeSimulation() {
        const params = {
            beginSituation: this.firstSituationData,
            endSituation: this.projectedSituationData,
            lockedParams: this.paramsToLock,
            modifiedParams: this.paramsToAjust,
        }
        const simulation = {
            totalIn: null,
            totalOut: null,
            lastStock: null,
            etpMag: null,
            realTimePerCase: null,
            realDTESInMonths: null,
            realCoverage: null,
        }

        console.log('big P', params)
    }
}
