import Route, { Access } from './Route'
import { Types } from '../utils/types'
import { preformatHumanResources } from '../utils/ventilator'
import { copyArray } from '../utils/array'

export default class RouteReaffectator extends Route {
  constructor (params) {
    super({ ...params, model: 'HumanResources' })

    this.model.onPreload()
  }

  @Route.Post({
    bodyType: Types.object().keys({
      backupId: Types.number().required(),
      date: Types.date().required(),
      contentieuxIds: Types.array(),
      categoriesIds: Types.array().required(),
      fonctionsIds: Types.array().required(),
    }),
    accesses: [Access.canVewHR],
  })
  async filterList (ctx) {
    let { backupId, date, categoriesIds, contentieuxIds, fonctionsIds } =
      this.body(ctx)
    if (
      !(await this.models.HRBackups.haveAccess(backupId, ctx.state.user.id))
    ) {
      ctx.throw(401, "Vous n'avez pas accès à cette juridiction !")
    }

    console.time('step1')
    const hr = await this.model.getCache(backupId)
    console.timeEnd('step1')
    console.time('step2')
    const preformatedAllHumanResource = preformatHumanResources(hr, date)
    console.timeEnd('step2')
    console.time('step3')
    let list = preformatedAllHumanResource.filter((hr) => {
      let isOk = true
      if (hr.category && categoriesIds.indexOf(hr.category.id) === -1) {
        isOk = false
      }

      if (hr.fonction && fonctionsIds.indexOf(hr.fonction.id) === -1) {
        isOk = false
      }

      if (hr.dateEnd && hr.dateEnd.getTime() < date.getTime()) {
        isOk = false
      }

      if (hr.dateStart && hr.dateStart.getTime() > date.getTime()) {
        isOk = false
      }

      return isOk
    })
    console.timeEnd('step3')
    console.time('step4')
    if (contentieuxIds) {
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
    }
    console.timeEnd('step4')
    console.time('step5')

    let listFiltered = [...list]
    const categories = await this.models.HRCategories.getAll()
    const originalReferentiel = (
      await this.models.ContentieuxReferentiels.getReferentiels()
    ).filter((r) => !contentieuxIds || contentieuxIds.indexOf(r.id) !== -1)

    const listFormated = categories
      .filter((c) => categoriesIds.indexOf(c.id) !== -1)
      .map((category) => ({
        originalLabel: category.label,
        referentiel: copyArray(originalReferentiel),
        allHr: listFiltered.filter(
          (h) => h.category && h.category.id === category.id
        ),
        categoryId: category.id,
      }))

    const activities = await this.models.Activities.getAll(backupId, date)

    this.sendOk(ctx, {
      list: listFormated,
      activities,
    })
  }
}
