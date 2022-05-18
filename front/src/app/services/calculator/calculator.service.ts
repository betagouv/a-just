import { Injectable } from '@angular/core'
import { mean, sortBy, sumBy } from 'lodash'
import { BehaviorSubject } from 'rxjs'
import {
    CalculatorInterface,
    etpAffectedInterface,
} from 'src/app/interfaces/calculator'
import { ContentieuReferentielInterface } from 'src/app/interfaces/contentieu-referentiel'
import { HRCategoryInterface } from 'src/app/interfaces/hr-category'
import { HumanResourceInterface } from 'src/app/interfaces/human-resource-interface'
import { MainClass } from 'src/app/libs/main-class'
import { month, workingDay } from 'src/app/utils/dates'
import { fixDecimal } from 'src/app/utils/numbers'
import { environment } from 'src/environments/environment'
import { ActivitiesService } from '../activities/activities.service'
import { ContentieuxOptionsService } from '../contentieux-options/contentieux-options.service'
import { HumanResourceService } from '../human-resource/human-resource.service'

const start = month(new Date(), -4)
const end = month(new Date(), -2, 'lastday')

@Injectable({
    providedIn: 'root',
})
export class CalculatorService extends MainClass {
    calculatorDatas: BehaviorSubject<CalculatorInterface[]> =
        new BehaviorSubject<CalculatorInterface[]>([])
    dateStart: BehaviorSubject<Date> = new BehaviorSubject<Date>(start)
    dateStop: BehaviorSubject<Date> = new BehaviorSubject<Date>(end)
    referentielIds: number[] = []
    timeoutUpdateDatas: any = null

    constructor(
        private humanResourceService: HumanResourceService,
        private activitiesService: ActivitiesService,
        private contentieuxOptionsService: ContentieuxOptionsService
    ) {
        super()

        this.watch(
            this.dateStart.subscribe(() => {
                if (this.calculatorDatas.getValue().length) {
                    this.cleanDatas()
                }
            })
        )

        this.watch(
            this.dateStop.subscribe(() => {
                if (this.calculatorDatas.getValue().length) {
                    this.cleanDatas()
                }
            })
        )

        this.watch(
            this.contentieuxOptionsService.backupId.subscribe(() => {
                if (this.calculatorDatas.getValue().length) {
                    this.cleanDatas()
                }
            })
        )

        this.watch(
            this.humanResourceService.hr.subscribe(() => {
                this.prepareDatas()
            })
        )
    }

    loadChildren(referentielId: number) {
        const list: CalculatorInterface[] = this.calculatorDatas.getValue()
        const findIndex = list.findIndex(
            (c) => c.contentieux.id === referentielId
        )
        if (findIndex !== -1) {
            list[findIndex].childrens = (list[findIndex].childrens || []).map(
                (c) => {
                    if (
                        list[findIndex].childIsVisible &&
                        c.needToCalculate === true
                    ) {
                        return {
                            ...c,
                            nbMonth: list[findIndex].nbMonth,
                            needToCalculate: false,
                            ...this.getActivityValues(
                                c.contentieux,
                                list[findIndex].nbMonth
                            ),
                        }
                    }

                    return c
                }
            )
            this.calculatorDatas.next(list)
        }
    }

    cleanDatas() {
        console.log('clean datas')

        const list: CalculatorInterface[] = this.calculatorDatas.getValue()
        for (let i = 0; i < list.length; i++) {
            const childrens = (list[i].childrens || []).map((c) => {
                return {
                    ...c,
                    totalIn: null,
                    totalOut: null,
                    lastStock: null,
                    etpMag: null,
                    etpFon: null,
                    etpCont: null,
                    realCoverage: null,
                    realDTESInMonths: null,
                    realTimePerCase: null,
                    calculateCoverage: null,
                    calculateDTESInMonths: null,
                    calculateTimePerCase: null,
                    calculateOut: null,
                    etpAffected: [],
                    childrens: [],
                    nbMonth: 0,
                    needToCalculate: true,
                }
            })

            list[i] = {
                ...list[i],
                totalIn: null,
                totalOut: null,
                lastStock: null,
                etpMag: null,
                etpFon: null,
                etpCont: null,
                realCoverage: null,
                realDTESInMonths: null,
                realTimePerCase: null,
                calculateCoverage: null,
                calculateDTESInMonths: null,
                calculateTimePerCase: null,
                calculateOut: null,
                etpAffected: [],
                childrens,
                nbMonth: 0,
                needToCalculate: true,
            }
        }
        this.calculatorDatas.next(list)
        this.syncDatas()
    }

    prepareDatas() {
        if (this.humanResourceService.categories.getValue().length === 0) {
            return
        }

        console.log('prepare datas')

        const list: CalculatorInterface[] = []
        const referentiels =
            this.humanResourceService.contentieuxReferentiel.getValue()
        for (let i = 0; i < referentiels.length; i++) {
            const childrens = (referentiels[i].childrens || []).map((c) => {
                const cont = { ...c, parent: referentiels[i] }

                return {
                    totalIn: null,
                    totalOut: null,
                    lastStock: null,
                    etpMag: null,
                    etpFon: null,
                    etpCont: null,
                    realCoverage: null,
                    realDTESInMonths: null,
                    realTimePerCase: null,
                    calculateCoverage: null,
                    calculateDTESInMonths: null,
                    calculateTimePerCase: null,
                    calculateOut: null,
                    etpAffected: [],
                    childrens: [],
                    contentieux: cont,
                    nbMonth: 0,
                    needToCalculate: true,
                    childIsVisible: false,
                }
            })

            list.push({
                totalIn: null,
                totalOut: null,
                lastStock: null,
                etpMag: null,
                etpFon: null,
                etpCont: null,
                realCoverage: null,
                realDTESInMonths: null,
                realTimePerCase: null,
                calculateCoverage: null,
                calculateDTESInMonths: null,
                calculateTimePerCase: null,
                calculateOut: null,
                etpAffected: [],
                childrens,
                contentieux: referentiels[i],
                nbMonth: 0,
                needToCalculate: true,
                childIsVisible: false,
            })
        }
        this.calculatorDatas.next(list)
        this.syncDatas()
    }

    syncDatas() {
        if (this.calculatorDatas.getValue().length === 0) {
            this.prepareDatas()
            return
        }

        console.time('sync datas')

        const list: CalculatorInterface[] = this.calculatorDatas.getValue()
        const nbMonth = this.getNbMonth()
        for (let i = 0; i < list.length; i++) {
            const childrens = (list[i].childrens || []).map((c) => {
                if (list[i].childIsVisible && c.needToCalculate === true) {
                    return {
                        ...c,
                        nbMonth,
                        needToCalculate: false,
                        ...this.getActivityValues(c.contentieux, nbMonth),
                    }
                }

                return c
            })

            if (list[i].needToCalculate === true) {
                list[i] = {
                    ...list[i],
                    ...this.getActivityValues(list[i].contentieux, nbMonth),
                    childrens,
                    nbMonth,
                    needToCalculate: false,
                }
            } else {
                list[i] = {
                    ...list[i],
                    childrens,
                    needToCalculate: false,
                }
            }
        }
        this.calculatorDatas.next(list)
        console.timeEnd('sync datas')
    }

    getActivityValues(
        referentiel: ContentieuReferentielInterface,
        nbMonth: number
    ) {
        const activities = sortBy(
            this.activitiesService.activities
                .getValue()
                .filter(
                    (a) =>
                        a.contentieux.id === referentiel.id &&
                        month(a.periode).getTime() >=
                            month(this.dateStart.getValue()).getTime() &&
                        month(a.periode).getTime() <=
                            month(this.dateStop.getValue()).getTime()
                ),
            'periode'
        )
        const totalIn = Math.floor(sumBy(activities, 'entrees') / nbMonth)
        const totalOut = Math.floor(sumBy(activities, 'sorties') / nbMonth)
        let lastStock = null
        if (activities.length) {
            const lastActivities = activities[activities.length - 1]
            if (
                lastActivities.stock !== null &&
                this.isSameMonthAndYear(
                    lastActivities.periode,
                    this.dateStop.getValue()
                )
            ) {
                lastStock = lastActivities.stock
            }
        }

        const realCoverage = fixDecimal(totalOut / totalIn)
        const realDTESInMonths =
            lastStock !== null ? fixDecimal(lastStock / totalOut) : null

        const etpAffected = this.getHRPositions(referentiel)
        const etpMag = etpAffected.length >= 0 ? etpAffected[0].totalEtp : 0
        const etpFon = etpAffected.length >= 1 ? etpAffected[1].totalEtp : 0
        const etpCont = etpAffected.length >= 2 ? etpAffected[2].totalEtp : 0

        // Temps moyens par dossier observé = (nb heures travaillées par mois) / (sorties moyennes par mois / etpt sur la periode)
        const realTimePerCase = fixDecimal(
            ((environment.nbDaysByMagistrat / 12) * environment.nbHoursPerDay) /
                (totalOut / sumBy(etpAffected, 'totalEtp'))
        )

        return {
            ...this.calculateActivities(
                referentiel,
                totalIn,
                lastStock,
                etpAffected
            ),
            totalIn,
            totalOut,
            lastStock,
            realCoverage,
            realDTESInMonths,
            realTimePerCase,
            etpMag,
            etpFon,
            etpCont,
            etpAffected,
        }
    }

    getNbMonth() {
        let totalMonth = 0

        const now = new Date(this.dateStart.getValue())
        do {
            totalMonth++
            now.setMonth(now.getMonth() + 1)
        } while (now.getTime() <= this.dateStop.getValue().getTime())

        if (totalMonth <= 0) {
            totalMonth = 1
        }

        return totalMonth
    }

    calculateActivities(
        referentiel: ContentieuReferentielInterface,
        totalIn: number,
        lastStock: number | null,
        etpAffected: etpAffectedInterface[]
    ) {
        let calculateTimePerCase = null
        let calculateOut = null
        let calculateCoverage = null
        let calculateDTESInMonths = null

        if (referentiel && referentiel.averageProcessingTime) {
            calculateTimePerCase = referentiel.averageProcessingTime
        } else if (
            referentiel &&
            referentiel.parent &&
            referentiel.parent.averageProcessingTime
        ) {
            calculateTimePerCase = referentiel.parent.averageProcessingTime
        }

        if (calculateTimePerCase) {
            calculateOut = Math.floor(
                (((sumBy(etpAffected, 'totalEtp') * environment.nbHoursPerDay) /
                    calculateTimePerCase) *
                    environment.nbDaysByMagistrat) /
                    12
            )
            calculateCoverage = fixDecimal(calculateOut / (totalIn || 0))
            calculateDTESInMonths =
                lastStock === null ? null : fixDecimal(lastStock / calculateOut)
        } else {
            calculateOut = null
            calculateCoverage = null
            calculateDTESInMonths = null
        }

        return {
            calculateTimePerCase,
            calculateOut,
            calculateCoverage,
            calculateDTESInMonths,
        }
    }

    getHRPositions(referentiel: ContentieuReferentielInterface) {
        const hr = this.humanResourceService.hr.getValue()
        const categories = this.humanResourceService.categories.getValue()
        const hrCategories: any = {}

        categories.map((c) => {
            hrCategories[c.label] = hrCategories[c.label] || {
                totalEtp: 0,
                list: [],
                rank: c.rank,
            }
        })

        for (let i = 0; i < hr.length; i++) {
            const etptAll = this.getHRVentilation(
                hr[i],
                referentiel,
                categories
            )
            Object.values(etptAll).map((c) => {
                if (c.etpt) {
                    hrCategories[c.label].list.push(hr[i])
                    hrCategories[c.label].totalEtp += c.etpt
                }
            })
        }

        const list = []
        for (const [key, value] of Object.entries(hrCategories)) {
            list.push({
                name: key,
                // @ts-ignore
                totalEtp: fixDecimal(value.totalEtp || 0),
                // @ts-ignore
                rank: value.rank,
            })
        }

        return sortBy(list, 'rank')
    }

    getHRVentilation(
        hr: HumanResourceInterface,
        referentiel: ContentieuReferentielInterface,
        categories: HRCategoryInterface[]
    ): number {
        const list: any = {}
        categories.map((c) => {
            list[c.id] = {
                etpt: 0,
                ...c,
            }
        })

        const now = new Date(this.dateStart.getValue())
        let nbDay = 0
        do {
            // only working day
            if (workingDay(now)) {
                nbDay++
                const { etp, situation } = this.humanResourceService.getEtpByDateAndPerson(referentiel.id, now, hr)

                if(etp !== null) {
                  // @ts-ignore
                  list[situation.category.id].etpt += etp
                }
            }
            now.setDate(now.getDate() + 1)
        } while (now.getTime() <= this.dateStop.getValue().getTime())

        // format render
        for (const property in list) {
            list[property].etpt = list[property].etpt / nbDay
        }

        return list
    }
}
