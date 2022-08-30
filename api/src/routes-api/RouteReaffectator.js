import Route, { Access } from './Route'
import { Types } from '../utils/types'
import { preformatHumanResources } from '../utils/ventilator'
import { getCategoryColor } from '../constants/categories'
import { sumBy } from 'lodash'

export default class RouteReaffectator extends Route {
  constructor (params) {
    super({ ...params, model: 'HumanResources' })

    this.model.onPreload()
  }

  @Route.Post({
    bodyType: Types.object().keys({
      backupId: Types.number().required(),
      date: Types.date().required(),
      contentieuxIds: Types.array().required(),
      categoriesIds: Types.array().required(),
      fonctionsIds: Types.array().required(),
    }),
    accesses: [Access.canVewHR],
  })
  async filterList (ctx) {
    let { backupId, date, categoriesIds, contentieuxIds, fonctionsIds } = this.body(ctx)
    if(!await this.models.HRBackups.haveAccess(backupId, ctx.state.user.id)) {
      ctx.throw(401, 'Vous n\'avez pas accès à cette juridiction !')
    }

    console.time('step1')
    const hr = await this.model.getCache(backupId)
    console.timeEnd('step1')
    console.time('step2')
    const preformatedAllHumanResource = preformatHumanResources(hr, date)
    console.timeEnd('step2')
    console.time('step3')
    let list =
      preformatedAllHumanResource
        .filter((hr) => {
          let isOk = true
          if (
            hr.category &&
            categoriesIds.indexOf(hr.category.id) === -1
          ) {
            isOk = false
          }

          if (
            hr.fonction &&
            fonctionsIds.indexOf(
              hr.fonction.id
            ) === -1
          ) {
            isOk = false
          }

          if (
            hr.dateEnd &&
            hr.dateEnd.getTime() < date.getTime()
          ) {
            isOk = false
          }

          if (
            hr.dateStart &&
            hr.dateStart.getTime() > date.getTime()
          ) {
            isOk = false
          }

          return isOk
        })
    console.timeEnd('step3')
    console.time('step4')
    list = list.filter((h) => {
      const idsOfactivities = h.currentActivities.map(
        (a) => (a.contentieux && a.contentieux.id) || 0
      )
      for (let i = 0; i < idsOfactivities.length; i++) {
        if (contentieuxIds.indexOf(idsOfactivities[i]) !== -1) {
          return true
        }
      }

      return false
    })
    console.timeEnd('step4')
    console.time('step5')

    let listFiltered = [...list]
    const categories = await this.models.HRCategories.getAll()
    const originalReferentiel = await this.models.ContentieuxReferentiels.getReferentiels()

    const listFormated = categories.filter(c => categoriesIds.indexOf(c.id) !== -1).map(
      (category) => {
        let label = category.label

        let referentiel = [...originalReferentiel].map((ref) => {
          ref.totalAffected = 0
          return ref
        })

        let group = listFiltered
          .filter((h) => h.category && h.category.id === category.id)
          .map((hr) => {
            hr.tmpActivities = {}

            referentiel = referentiel.map((ref) => {
              hr.tmpActivities[ref.id] = hr.currentActivities.filter(
                (r) => r.contentieux && r.contentieux.id === ref.id
              )
              const timeAffected = sumBy(hr.tmpActivities[ref.id], 'percent')
              if (timeAffected) {
                let realETP = (hr.etp || 0) - hr.hasIndisponibility
                if (realETP < 0) {
                  realETP = 0
                }
                ref.totalAffected =
                  (ref.totalAffected || 0) + (timeAffected / 100) * realETP
              }

              return ref
            })

            return hr
          })

        if (group.length > 1) {
          if (label.indexOf('agistrat') !== -1) {
            label = label.replace('agistrat', 'agistrats')
          } else {
            label += 's'
          }
        }

        return {
          textColor: getCategoryColor(label),
          bgColor: getCategoryColor(label, 0.2),
          referentiel,
          label,
          hr: group,
          categoryId: category.id,
        }
      }
    )

    this.sendOk(ctx, {
      list: listFormated,
    })
  }
}
