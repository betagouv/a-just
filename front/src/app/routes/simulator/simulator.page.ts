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
    //@ViewChild('percentageInput')
    //@ViewChild('ETPT')
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

    resetPercentage: boolean = false
    valueToAjust: string = ''
    currentNode: any | undefined = {}

    decisionTree = tree

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
    getFieldValue(param: string, data: SimulatorInterface | null) {
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
                    return data?.realCoverage || '0'
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
                    return (
                        this.decimalToStringDate(data?.realTimePerCase) || '0'
                    )
                case 'ETPTGreffe':
                    return ''
            }
        }
        return
    }

    decimalToStringDate(decimal: number | null | undefined) {
        if (decimal != null) {
            const strArray = String(decimal).split('.')
            let minute = strArray[1]
                ? String(Math.ceil((1 / 100) * +strArray[1] * 60))
                : '00'
            minute = minute.length === 1 ? '0' + minute : minute
            return strArray[0] + 'h' + minute
        }
        return
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
        this.disabled = 'disabled'
    }

    getMin(): Date {
        const date = new Date(this.dateStart)
        date.setDate(this.dateStart.getDate() + 1)
        return date
    }

    printConsole(button: any): void {
        console.log(button.id)
        const find = this.decisionTree.find((item) => item.label === button.id)
        console.log(find)
        this.currentNode = find
        this.openPopup = true
    }

    doSomething(event: any, volumeInput: any): void {
        const result = volumeInput | parseInt(this.valueToAjust) | 0
        console.log('do', result)
    }

    resetP() {
        this.resetPercentage = true
        console.log('reset', this.resetPercentage)
    }

    onUpdateValue(event: any) {
        console.log('the event - ', event)
        this.valueToAjust = event
    }

    getPopupTitle(): string {
        return this.currentNode?.popupTitle
    }
}
