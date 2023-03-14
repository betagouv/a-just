import Route, { Access } from './Route'
import { Types } from '../utils/types'
import { USER_REMOVE_HR } from '../constants/log-codes'
import { preformatHumanResources } from '../utils/ventilator'
import { getBgCategoryColor, getCategoryColor } from '../constants/categories'
import { copyArray } from '../utils/array'
import { getHumanRessourceList } from '../utils/humanServices'
import { getCategoriesByUserAccess } from '../utils/hr-catagories'

/**
 * Route des fiches
 */
export default class RouteHumanResources extends Route {
  /**
   * Constructeur
   * @param {*} params
   */
  constructor (params) {
    super({ ...params, model: 'HumanResources' })

    setTimeout(() => {
      this.model.onPreload() // preload juridiction after 1 minute
    }, 60000)
  }

  /**
   * Interface de la liste des juridictions
   * @param {*} backupId
   */
  @Route.Post({
    bodyType: Types.object().keys({
      backupId: Types.any(),
    }),
    accesses: [Access.canVewHR],
  })
  async getCurrentHr (ctx) {
    let { backupId } = this.body(ctx)
    const backups = await this.model.models.HRBackups.list(ctx.state.user.id)
    backupId = backupId || (backups.length ? backups[backups.length - 1].id : null)

    this.sendOk(ctx, {
      backups,
      backupId,
      categories: await this.models.HRCategories.getAll(),
      fonctions: await this.models.HRFonctions.getAll(),
    })
  }

  /**
   * Interface pour supprimer une juridiction
   */
  @Route.Delete({
    path: 'remove-backup/:backupId',
    accesses: [Access.canVewHR],
  })
  async removeBackup (ctx) {
    const { backupId } = ctx.params

    await this.model.models.HRBackups.removeBackup(backupId)

    this.sendOk(ctx, 'OK')
  }

  /**
   * Interface pour copier une juridiction
   * @param {*} backupId
   * @param {*} backupName
   */
  @Route.Post({
    bodyType: Types.object().keys({
      backupId: Types.number().required(),
      backupName: Types.string().required(),
    }),
    accesses: [Access.canVewHR],
  })
  async duplicateBackup (ctx) {
    const { backupId, backupName } = this.body(ctx)

    this.sendOk(ctx, await this.model.models.HRBackups.duplicateBackup(backupId, backupName))
  }

  /**
   * Interface qui retourne toutes les juridictions
   */
  @Route.Get({
    accesses: [Access.isAdmin],
  })
  async getBackupList (ctx) {
    this.sendOk(ctx, await this.model.models.HRBackups.getAll())
  }

  /**
   * Interface qui permet d'une fiche
   * @param {*} backupId
   * @param {*} hr
   */
  @Route.Post({
    bodyType: Types.object().keys({
      backupId: Types.number(),
      hr: Types.any(),
    }),
    accesses: [Access.canVewHR],
  })
  async updateHr (ctx) {
    let { backupId, hr } = this.body(ctx)

    const responseUpdate = await this.model.updateHR(hr, backupId)

    this.sendOk(ctx, responseUpdate)
  }

  /**
   * Interface de suppression d'une fiche
   */
  @Route.Delete({
    path: 'remove-hr/:hrId',
    accesses: [Access.canVewHR],
  })
  async removeHR (ctx) {
    const { hrId } = ctx.params

    if (await this.models.HumanResources.haveAccess(hrId, ctx.state.user.id)) {
      const onRemoveHR = await this.model.removeHR(hrId)

      if (onRemoveHR) {
        this.sendOk(ctx, 'Ok')
        await this.models.Logs.addLog(USER_REMOVE_HR, ctx.state.user.id, {
          hrId,
        })
      } else {
        ctx.throw(401, "Cette personne n'est pas supprimable !")
      }
    } else {
      this.sendOk(ctx, null)
    }
  }

  /**
   * Interface de suppression d'une situation d'une fiche
   */
  @Route.Delete({
    path: 'remove-situation/:situationId',
    accesses: [Access.canVewHR],
  })
  async removeSituation (ctx) {
    const { situationId } = ctx.params
    const hrId = await this.models.HRSituations.haveHRId(situationId, ctx.state.user.id)
    if (hrId) {
      if (await this.models.HRSituations.destroyById(situationId)) {
        this.sendOk(ctx, await this.model.getHr(hrId))
      }
    }

    this.sendOk(ctx, null)
  }

  /**
   * Interface de la liste des fiches d'une juridiction
   * @param {*} backupId
   * @param {*} date
   * @param {*} contentieuxIds
   * @param {*} categoriesIds
   * @param {*} extractor
   * @param {*} endPeriodToCheck
   */
  @Route.Post({
    bodyType: Types.object().keys({
      backupId: Types.number().required(),
      date: Types.date().required(),
      contentieuxIds: Types.array(),
      categoriesIds: Types.array().required(),
      extractor: Types.boolean().required(),
      endPeriodToCheck: Types.date(),
    }),
    accesses: [Access.canVewHR],
  })
  async filterList (ctx) {
    let { backupId, date, endPeriodToCheck, categoriesIds, contentieuxIds, extractor } = this.body(ctx)
    if (!(await this.models.HRBackups.haveAccess(backupId, ctx.state.user.id))) {
      ctx.throw(401, "Vous n'avez pas accès à cette juridiction !")
    }

    console.time('step1')
    let hr = await this.model.getCache(backupId)
    console.timeEnd('step1')
    console.time('step2')
    const preformatedAllHumanResource = preformatHumanResources(hr, date)
    console.timeEnd('step2')
    let list = await getHumanRessourceList(preformatedAllHumanResource, contentieuxIds, categoriesIds, date, endPeriodToCheck)
    const allCategories = await this.models.HRCategories.getAll()

    if (extractor === false) {
      let listFiltered = [...list]
      const categories = getCategoriesByUserAccess(allCategories, ctx.state.user)
      const originalReferentiel = await this.models.ContentieuxReferentiels.getReferentiels()

      const listFormated = categories
        .filter((c) => categoriesIds.indexOf(c.id) !== -1)
        .map((category) => {
          let label = category.label

          let referentiel = copyArray(originalReferentiel)
            .filter((r) => r.label !== 'Indisponibilité')
            .map((ref) => {
              ref.totalAffected = 0
              return ref
            })

          let group = listFiltered.filter((h) => h.category && h.category.id === category.id)

          if (group.length > 1) {
            if (label.indexOf('agistrat') !== -1) {
              label = label.replace('agistrat', 'agistrats du siège')
            } else {
              label += 's'
            }
          }

          return {
            textColor: getCategoryColor(label),
            bgColor: getBgCategoryColor(label),
            referentiel,
            label,
            hr: group,
            categoryId: category.id,
          }
        })
      console.log('step7')

      // if filter by user access to categories
      if (categories.length !== allCategories.length) {
        const ids = categories.map((c) => c.id)
        hr = hr.filter((h) => (h.situations || []).some((s) => ids.indexOf((s.category || { id: -1 }).id) !== -1))
      }

      this.sendOk(ctx, {
        list: listFormated,
        allPersons: hr,
      })
    } else {
      console.timeEnd('step5')
      console.log('step6')

      this.sendOk(ctx, {
        list,
      })
    }
  }

  /**
   * Interface des détails d'une fiche
   */
  @Route.Get({
    path: 'read-hr/:hrId',
    accesses: [Access.canVewHR],
  })
  async readHr (ctx) {
    const { hrId } = ctx.params

    if (await this.model.haveAccess(hrId, ctx.state.user.id)) {
      this.sendOk(ctx, await this.model.getHrDetails(hrId))
    } else {
      this.sendOk(ctx, null)
    }
  }
}
