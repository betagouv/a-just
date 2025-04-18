import Route, { Access } from './Route'
import { Types } from '../utils/types'
import { EXECUTE_VENTILATION, USER_REMOVE_HR } from '../constants/log-codes'
import { preformatHumanResources } from '../utils/ventilator'
import { getBgCategoryColor, getCategoryColor, getHoverCategoryColor } from '../constants/categories'
import { copyArray } from '../utils/array'
import { getHumanRessourceList } from '../utils/humanServices'
import { getCategoriesByUserAccess } from '../utils/hr-catagories'
import { today } from '../utils/date'
import { findAllSituations, findSituation } from '../utils/human-resource'
import { orderBy } from 'lodash'
import { etpLabel } from '../constants/referentiel'

/**
 * Route des fiches
 */
export default class RouteHumanResources extends Route {
  // model de BDD
  model

  /**
   * Constructeur
   * @param {*} params
   */
  constructor (params) {
    super(params)

    this.model = params.models.HumanResources
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
   * Interface de suppression d'une fiche (For test only)
   */
  @Route.Delete({
    path: 'remove-hr-test/:hrId',
    accesses: [Access.canVewHR],
  })
  async removeHRTest (ctx) {
    const { hrId } = ctx.params

    if (await this.models.HumanResources.haveAccess(hrId, ctx.state.user.id)) {
      const onRemoveHR = await this.model.removeHRTest(hrId)

      if (onRemoveHR) {
        this.sendOk(ctx, 'Ok')
        // await this.models.Logs.addLog(USER_REMOVE_HR, ctx.state.user.id, {
        //   hrId,
        // })
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
   * Interface de suppression d'une situation d'une fiche (For test only)
   */
  @Route.Delete({
    path: 'remove-situation-test/:situationId',
    accesses: [Access.canVewHR],
  })
  async removeSituationTest (ctx) {
    const { situationId } = ctx.params
    const hrId = await this.models.HRSituations.haveHRId(situationId, ctx.state.user.id)
    if (hrId) {
      if (await this.models.HRSituations.destroyById(situationId, { force: true })) {
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
      subContentieuxIds: Types.array(),
      categoriesIds: Types.array().required(),
      endPeriodToCheck: Types.date(),
    }),
    accesses: [Access.canVewHR],
  })
  async filterList (ctx) {
    let { backupId, date, endPeriodToCheck, categoriesIds, contentieuxIds, subContentieuxIds } = this.body(ctx)
    if (!(await this.models.HRBackups.haveAccess(backupId, ctx.state.user.id))) {
      ctx.throw(401, "Vous n'avez pas accès à cette juridiction !")
    }

    date = today(date)

    let hr = await this.model.getCache(backupId)
    const preformatedAllHumanResource = preformatHumanResources(hr, date)

    let list = await getHumanRessourceList(preformatedAllHumanResource, contentieuxIds, subContentieuxIds, categoriesIds, date, endPeriodToCheck, true)

    const allCategories = await this.models.HRCategories.getAll()

    if (categoriesIds && categoriesIds.length === 3 && (!contentieuxIds || contentieuxIds.length === 0)) {
      // memorize first execution by user
      this.models.Logs.addLog(EXECUTE_VENTILATION, ctx.state.user.id)
    }

    let listFiltered = [...list]

    const categories = getCategoriesByUserAccess(allCategories, ctx.state.user)
    const originalReferentiel = await this.models.ContentieuxReferentiels.getReferentiels(backupId)

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
          if (label.indexOf('agistrat') === 1) {
            label = label.replace('agistrat', 'agistrats du siège')
          } else {
            //label += 's'
          }
        }

        return {
          textColor: getCategoryColor(label),
          bgColor: getBgCategoryColor(label),
          hoverColor: getHoverCategoryColor(label),
          referentiel,
          label,
          hr: group,
          categoryId: category.id,
        }
      })

    // if filter by user access to categories
    if (categories.length !== allCategories.length) {
      const ids = categories.map((c) => c.id)
      hr = hr.filter((h) => (h.situations || []).some((s) => ids.indexOf((s.category || { id: -1 }).id) !== -1))
    }

    this.sendOk(ctx, {
      list: listFormated,
      allPersons: orderBy(
        hr.map((person) => {
          let sitations = findAllSituations(person, this.dateSelected)
          if (sitations.length === 0) {
            // if no situation in the past get to the future
            sitations = findAllSituations(person, this.dateSelected, true, true)
          }
          const { currentSituation } = findSituation(person, this.dateSelected)
          let etp = (currentSituation && currentSituation.etp) || null
          if (etp < 0) {
            etp = 0
          }

          return {
            id: person.id,
            currentActivities: (currentSituation && currentSituation.activities) || [],
            lastName: person.lastName,
            firstName: person.firstName,
            isIn: false,
            dateStart: person.dateStart,
            dateEnd: person.dateEnd,
            sitations: sitations,
            etp,
            etpLabel: etp ? etpLabel(etp) : null,
            categoryName: sitations.length && sitations[0].category ? sitations[0].category.label : '',
            category: sitations.length && sitations[0].category ? sitations[0].category : null,
            categoryRank: sitations.length && sitations[0].category ? sitations[0].category.rank : null,
            fonctionRank: sitations.length && sitations[0].fonction ? sitations[0].fonction.rank : null,
            fonction: sitations.length && sitations[0].fonction ? sitations[0].fonction : null,
            indisponibilities: person.indisponibilities,
          }
        }),
        ['categoryRank', 'fonctionRank', 'lastName']
      ),
    })
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
