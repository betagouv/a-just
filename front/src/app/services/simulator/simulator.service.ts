import { Injectable } from '@angular/core'
import { groupBy, last, sortBy, sumBy } from 'lodash'
import { BehaviorSubject } from 'rxjs'
import { SimulatorInterface } from 'src/app/interfaces/simulator'
import { HRCategoryInterface } from 'src/app/interfaces/hr-category'
import { HumanResourceInterface } from 'src/app/interfaces/human-resource-interface'
import { MainClass } from 'src/app/libs/main-class'
import { month, workingDay } from 'src/app/utils/dates'
import { fixDecimal } from 'src/app/utils/numbers'
import { ActivitiesService } from '../activities/activities.service'
import { HumanResourceService } from '../human-resource/human-resource.service'
import { environment } from 'src/environments/environment'

const start = new Date()
const end = new Date()

@Injectable({
    providedIn: 'root',
})
export class SimulatorService extends MainClass {
    situationActuelle: BehaviorSubject<SimulatorInterface | null> =
        new BehaviorSubject<SimulatorInterface | null>(null)
    situationProjected: BehaviorSubject<SimulatorInterface | null> =
        new BehaviorSubject<SimulatorInterface | null>(null)
    contentieuOrSubContentieuId: BehaviorSubject<number | null> =
        new BehaviorSubject<number | null>(null)
    dateStart: BehaviorSubject<Date> = new BehaviorSubject<Date>(start)
    dateStop: BehaviorSubject<Date> = new BehaviorSubject<Date>(end)
    startCurrentSituation = month(new Date(), -12)
    endCurrentSituation = month(new Date(), -1, 'lastday')
    constructor(
        private humanResourceService: HumanResourceService,
        private activitiesService: ActivitiesService
    ) {
        super()

        this.watch(
            this.contentieuOrSubContentieuId.subscribe(() => {
                if (this.contentieuOrSubContentieuId.getValue()) {
                    this.syncDatas(this.contentieuOrSubContentieuId.getValue())
                }
            })
        )

        this.watch(
            this.dateStart.subscribe(() => {
                if (this.contentieuOrSubContentieuId.getValue()) {
                    this.syncDatas(
                        this.contentieuOrSubContentieuId.getValue(),
                        this.dateStart.getValue()
                    )
                }
            })
        )

        this.watch(
            this.dateStop.subscribe(() => {
                if (this.contentieuOrSubContentieuId.getValue()) {
                    this.syncDatas(
                        this.contentieuOrSubContentieuId.getValue(),
                        undefined,
                        this.dateStop.getValue()
                    )
                }
            })
        )
    }

    syncDatas(referentielId: number | null, dateStart?: Date, dateStop?: Date) {
        if (referentielId !== null) {
            const nbMonth = 12
            const list: SimulatorInterface | null = {
                ...this.getActivityValues(
                    referentielId,
                    nbMonth,
                    dateStart,
                    dateStop
                ),
                etpFon: null,
                etpCont: null,
                calculateCoverage: null,
                calculateDTESInMonths: null,
                calculateTimePerCase: null,
                nbMonth,
            }
            if (!dateStop) this.situationActuelle.next(list)
        }
    }

    getActivityValues(
        referentielId: number | null,
        nbMonth: number,
        dateStart?: Date,
        dateStop?: Date
    ) {
        // get 12 last months starting from now
        let activities = sortBy(
            this.activitiesService.activities
                .getValue()
                .filter(
                    (a) =>
                        a.contentieux.id === referentielId &&
                        month(a.periode).getTime() >=
                            month(this.startCurrentSituation).getTime() &&
                        month(a.periode).getTime() <=
                            month(this.endCurrentSituation).getTime()
                ),
            'periode'
        )

        // check when is the last month available on this periode with entrees and sorties
        let counter = 1
        let lastActivitiesEntreesSorties: any = []
        do {
            counter--
            lastActivitiesEntreesSorties = activities.filter((a) =>
                this.isSameMonthAndYear(
                    a.periode,
                    month(this.endCurrentSituation, counter, 'lastday')
                )
            )
            if (
                lastActivitiesEntreesSorties.length !== 0 &&
                (lastActivitiesEntreesSorties[0].entrees ||
                    lastActivitiesEntreesSorties[0].sorties)
            )
                break
        } while (lastActivitiesEntreesSorties.length === 0 && counter != -12)

        // if last month not available, then get the 12 last months starting from the last available
        if (counter !== -12 && counter !== 0) {
            activities = sortBy(
                this.activitiesService.activities
                    .getValue()
                    .filter(
                        (a) =>
                            a.contentieux.id === referentielId &&
                            month(a.periode).getTime() >=
                                month(
                                    this.startCurrentSituation,
                                    counter
                                ).getTime() &&
                            month(a.periode).getTime() <=
                                month(
                                    this.endCurrentSituation,
                                    counter,
                                    'lastday'
                                ).getTime()
                    ),
                'periode'
            )
        }

        let totalIn = Math.floor(sumBy(activities, 'entrees') / nbMonth)
        let totalOut = Math.floor(sumBy(activities, 'sorties') / nbMonth)

        let lastStock = null

        if (activities.length) {
            // get the last stock available
            let lastActivities: any = []
            let nbOfMonth = 1
            do {
                nbOfMonth--
                lastActivities = activities.filter((a) =>
                    this.isSameMonthAndYear(
                        a.periode,
                        month(this.endCurrentSituation, nbOfMonth, 'lastday')
                    )
                )
                if (lastActivities.length !== 0 && lastActivities[0].stock)
                    break
            } while (lastActivities.length === 0 && nbOfMonth != -12)

            lastStock = sumBy(lastActivities, 'stock')

            let realCoverage = fixDecimal(totalOut / totalIn)
            let realDTESInMonths =
                lastStock !== null && totalOut !== null
                    ? fixDecimal(lastStock / totalOut)
                    : null

            let etpAffected = this.getHRPositions(referentielId as number)
            let etpMag = etpAffected.length >= 0 ? etpAffected[0].totalEtp : 0

            let etpAffectedToCompute = this.getHRPositions(
                referentielId as number,
                month(this.startCurrentSituation, counter),
                true,
                month(this.endCurrentSituation, counter, 'lastday')
            )
            let etpMagToCompute =
                etpAffectedToCompute.length >= 0
                    ? etpAffectedToCompute[0].totalEtp
                    : 0

            console.log('display etpMagToCompute', etpMagToCompute)
            // Temps moyens par dossier observé = (nb heures travaillées par mois) / (sorties moyennes par mois / etpt sur la periode)
            let realTimePerCase = fixDecimal(
                ((environment.nbDaysByMagistrat / 12) *
                    environment.nbHoursPerDay) /
                    (totalOut / sumBy(etpAffected, 'totalEtp'))
            )

            const today = new Date()
            if (
                dateStart &&
                (dateStart?.getDate() !== today.getDate() ||
                    dateStart?.getMonth() !== today.getMonth() ||
                    dateStart?.getFullYear() !== today.getFullYear())
            ) {
                let nbDay = 0
                const now = new Date()
                do {
                    // only working day
                    if (workingDay(now)) {
                        nbDay++
                    }
                    now.setDate(now.getDate() + 1)
                } while (now.getTime() <= this.dateStart.getValue().getTime())

                /**
                totalOut = Math.floor(
                    (sumBy(activities, 'sorties') +
                        (nbDay / 17.33) *
                            ((etpMag * 8 * 17.33) / realTimePerCase)) /
                        (nbMonth + nbDay / 17.33)
                )
 */

                etpAffected = this.getHRPositions(
                    referentielId as number,
                    dateStart
                )

                etpMag = etpAffected.length >= 0 ? etpAffected[0].totalEtp : 0

                totalOut = Math.floor((etpMag * 8 * 17.33) / realTimePerCase)

                lastStock = Math.floor(
                    lastStock -
                        (nbDay / 21) * ((etpMag * 8 * 21) / realTimePerCase) +
                        (nbDay / 21) * totalIn
                )

                realCoverage = fixDecimal(totalOut / totalIn)
                realDTESInMonths =
                    lastStock !== null && totalOut !== null
                        ? fixDecimal(lastStock / totalOut)
                        : null
            }
            if (dateStop) {
                let nbDay = 0
                const start = dateStart || new Date()
                do {
                    // only working day
                    if (workingDay(start)) {
                        nbDay++
                    }
                    start.setDate(start.getDate() + 1)
                } while (start.getTime() <= this.dateStop.getValue().getTime())

                const projectedEtpAffected = this.getHRPositions(
                    referentielId as number,
                    dateStop
                )
                const projectedEtpMag =
                    projectedEtpAffected.length >= 0
                        ? projectedEtpAffected[0].totalEtp
                        : 0

                const projectedTotalOut = Math.floor(
                    (projectedEtpMag * 8 * 17.33) / realTimePerCase
                )

                const projectedLastStock = Math.floor(
                    lastStock -
                        (nbDay / 17.33) *
                            ((etpMag * 8 * 17.33) / realTimePerCase) +
                        (nbDay / 17.33) * totalIn
                )

                const projectedRealCoverage = fixDecimal(
                    projectedTotalOut / totalIn
                )
                const projectedRealDTESInMonths =
                    projectedLastStock !== null && projectedTotalOut !== null
                        ? fixDecimal(projectedLastStock / projectedTotalOut)
                        : null

                const list = {
                    totalIn,
                    totalOut: projectedTotalOut,
                    lastStock: projectedLastStock,
                    realCoverage: projectedRealCoverage,
                    realDTESInMonths: projectedRealDTESInMonths,
                    realTimePerCase: realTimePerCase,
                    etpMag: projectedEtpMag,
                    etpAffected: projectedEtpAffected,
                    etpFon: null,
                    etpCont: null,
                    calculateCoverage: null,
                    calculateDTESInMonths: null,
                    calculateTimePerCase: null,
                    nbMonth,
                }
                this.situationProjected.next(list)
            }

            return {
                totalIn,
                totalOut,
                lastStock,
                realCoverage,
                realDTESInMonths,
                realTimePerCase,
                etpMag,
                etpAffected,
            }
        } else
            return {
                totalIn: null,
                totalOut: null,
                lastStock: null,
                realCoverage: null,
                realDTESInMonths: null,
                realTimePerCase: null,
                etpMag: null,
                etpAffected: null,
            }
    }

    getHRPositions(
        referentiel: number,
        date?: Date,
        onPeriod?: boolean,
        dateStop?: Date
    ) {
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
            const etptAll =
                onPeriod === true
                    ? this.getHRVentilationOnPeriod(
                          hr[i],
                          referentiel,
                          categories,
                          date instanceof Date ? date : undefined,
                          dateStop instanceof Date ? dateStop : undefined
                      )
                    : this.getHRVentilation(
                          hr[i],
                          referentiel,
                          categories,
                          date
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
        referentielId: number,
        categories: HRCategoryInterface[],
        date?: Date
    ): number {
        const list: any = {}
        categories.map((c) => {
            list[c.id] = {
                etpt: 0,
                ...c,
            }
        })

        const now = date ? date : new Date()

        // only working day
        const situation = this.humanResourceService.findSituation(hr, now)
        if (situation && situation.category && situation.category.id) {
            const activitiesFiltred = (situation.activities || []).filter(
                (a) => a.contentieux?.id == referentielId
            )
            const indispoFiltred =
                this.humanResourceService.findAllIndisponibilities(hr, now)

            let reelEtp = situation.etp - sumBy(indispoFiltred, 'percent')
            if (reelEtp < 0) {
                reelEtp = 0
            }
            const etp = (reelEtp * sumBy(activitiesFiltred, 'percent')) / 100

            list[situation.category.id].etpt += etp
        }

        // format render
        for (const property in list) {
            list[property].etpt = list[property].etpt / 1
        }

        return list
    }

    getHRVentilationOnPeriod(
        hr: HumanResourceInterface,
        referentielId: number,
        categories: HRCategoryInterface[],
        dateStart: Date | undefined,
        dateStop: Date | undefined
    ): number {
        const list: any = {}
        categories.map((c) => {
            list[c.id] = {
                etpt: 0,
                ...c,
            }
        })

        const now = dateStart instanceof Date ? dateStart : new Date()
        const stop = dateStop instanceof Date ? dateStop : new Date()

        let nbDay = 0
        do {
            // only working day
            if (workingDay(now)) {
                nbDay++
                const situation = this.humanResourceService.findSituation(
                    hr,
                    now
                )

                if (situation && situation.category && situation.category.id) {
                    const activitiesFiltred = (
                        situation.activities || []
                    ).filter(
                        (a) =>
                            a.contentieux && a.contentieux.id === referentielId
                    )
                    const indispoFiltred =
                        this.humanResourceService.findAllIndisponibilities(
                            hr,
                            now
                        )
                    let reelEtp =
                        situation.etp - sumBy(indispoFiltred, 'percent')
                    if (reelEtp < 0) {
                        reelEtp = 0
                    }

                    const etp =
                        (reelEtp * sumBy(activitiesFiltred, 'percent')) / 100

                    list[situation.category.id].etpt += etp
                }
            }
            now.setDate(now.getDate() + 1)
        } while (now.getTime() <= stop.getTime())

        // format render
        for (const property in list) {
            list[property].etpt = list[property].etpt / nbDay
        }

        return list
    }
}
