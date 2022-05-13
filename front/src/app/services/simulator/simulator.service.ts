import { Injectable } from '@angular/core'
import { last, sortBy, sumBy } from 'lodash'
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
    contentieuOrSubContentieuId: BehaviorSubject<number | null> =
        new BehaviorSubject<number | null>(null)
    dateStart: BehaviorSubject<Date> = new BehaviorSubject<Date>(start)
    dateStop: BehaviorSubject<Date> = new BehaviorSubject<Date>(end)
    startCurrentSituation = month(new Date(), -13)
    endCurrentSituation = month(new Date(), -2, 'lastday')
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
    }

    syncDatas(referentielId: number | null, dateStart?: Date) {
        if (referentielId !== null) {
            const nbMonth = 12
            const list: SimulatorInterface | null = {
                ...this.getActivityValues(referentielId, nbMonth),
                etpFon: null,
                etpCont: null,
                calculateCoverage: null,
                calculateDTESInMonths: null,
                calculateTimePerCase: null,
                nbMonth,
            }
            this.situationActuelle.next(list)
        }
    }

    getActivityValues(referentielId: number | null, nbMonth: number) {
        const activities = sortBy(
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

        const totalIn = Math.floor(sumBy(activities, 'entrees') / nbMonth)
        const totalOut = Math.floor(sumBy(activities, 'sorties') / nbMonth)
        let lastStock = null

        if (activities.length) {
            let lastActivities: any = []
            let nbOfMonth = 1
            do {
                nbOfMonth--
                lastActivities = activities.filter((a) =>
                    this.isSameMonthAndYear(
                        a.periode,
                        month(this.endCurrentSituation, -1, 'lastday')
                    )
                )
            } while (lastActivities.length === 0 || nbOfMonth != -12)
            lastStock = sumBy(lastActivities, 'stock')

            const realCoverage = fixDecimal(totalOut / totalIn)
            const realDTESInMonths =
                lastStock !== null ? fixDecimal(lastStock / totalOut) : null

            const etpAffected = this.getHRPositions(referentielId as number)
            const etpMag = etpAffected.length >= 0 ? etpAffected[0].totalEtp : 0

            // Temps moyens par dossier observé = (nb heures travaillées par mois) / (sorties moyennes par mois / etpt sur la periode)
            const realTimePerCase = fixDecimal(
                ((environment.nbDaysByMagistrat / 12) *
                    environment.nbHoursPerDay) /
                    (totalOut / sumBy(etpAffected, 'totalEtp'))
            )

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

    getHRPositions(referentiel: number) {
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
        referentielId: number,
        categories: HRCategoryInterface[]
    ): number {
        const list: any = {}
        categories.map((c) => {
            list[c.id] = {
                etpt: 0,
                ...c,
            }
        })

        const now = new Date(this.startCurrentSituation)
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
                    ).filter((a) => a.contentieux?.id == referentielId)
                    const indispoFiltred =
                        this.humanResourceService.findAllIndisponibilities(
                            hr,
                            now
                        )
                    let etp =
                        (situation.etp *
                            (100 - sumBy(indispoFiltred, 'percent'))) /
                        100
                    etp *= sumBy(activitiesFiltred, 'percent') / 100

                    list[situation.category.id].etpt += etp
                }
            }
            now.setDate(now.getDate() + 1)
        } while (now.getTime() <= this.endCurrentSituation.getTime())

        // format render
        for (const property in list) {
            list[property].etpt = list[property].etpt / nbDay
        }

        return list
    }
}
