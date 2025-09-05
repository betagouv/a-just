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
import { loadOrWarmHR } from '../utils/redis'

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
  constructor(params) {
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
  async getCurrentHr(ctx) {
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
  async removeBackup(ctx) {
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
  async duplicateBackup(ctx) {
    const { backupId, backupName } = this.body(ctx)

    this.sendOk(ctx, await this.model.models.HRBackups.duplicateBackup(backupId, backupName))
  }

  /**
   * Interface qui retourne toutes les juridictions
   */
  @Route.Get({
    accesses: [Access.isAdmin],
  })
  async getBackupList(ctx) {
    this.sendOk(ctx, await this.model.models.HRBackups.getAll())
  }

  /**
   * Interface qui permet la creation ou maj d'une fiche
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
  async updateHr(ctx) {
    const { backupId, hr } = this.body(ctx)

    // Étape 1 : Mise à jour en base de données
    const updatedAgent = await this.model.updateHR(hr, backupId)

    if (!updatedAgent?.id) {
      console.error('❌ Impossible de récupérer un agent valide après updateHR', updatedAgent)
      return this.sendError(ctx, "Erreur lors de la mise à jour de l'agent")
    }

    this.sendOk(ctx, updatedAgent)
  }

  /**
   * Interface de suppression d'une fiche
   */
  @Route.Delete({
    path: 'remove-hr/:hrId',
    accesses: [Access.canVewHR],
  })
  async removeHR(ctx) {
    const { hrId } = ctx.params

    // Vérifie l'accès
    if (await this.models.HumanResources.haveAccess(hrId, ctx.state.user.id)) {
      const removedAgent = await this.model.removeHR(hrId)

      if (removedAgent && removedAgent.backupId) {
        // Log
        await this.models.Logs.addLog(USER_REMOVE_HR, ctx.state.user.id, { hrId })

        this.sendOk(ctx, 'Ok')
      } else {
        ctx.throw(401, "Cette personne n'est pas supprimable ou introuvable !")
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
  async removeHRTest(ctx) {
    if (process.env.NODE_ENV !== 'test') {
      ctx.throw(401, "Cette route n'est pas disponible")
      return
    }

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
  async removeSituation(ctx) {
    const { situationId } = ctx.params
    const hrId = await this.models.HRSituations.haveHRId(situationId, ctx.state.user.id)
    if (hrId) {
      if (await this.models.HRSituations.destroySituationId(situationId)) {
        const agent = await this.model.getHr(hrId)
        this.sendOk(ctx, agent)
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
  async removeSituationTest(ctx) {
    if (process.env.NODE_ENV !== 'test') {
      ctx.throw(401, "Cette route n'est pas disponible")
      return
    }

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
  async filterList(ctx) {
    let { backupId, date, endPeriodToCheck, categoriesIds, contentieuxIds, subContentieuxIds } = this.body(ctx)
    if (!(await this.models.HRBackups.haveAccess(backupId, ctx.state.user.id))) {
      ctx.throw(401, "Vous n'avez pas accès à cette juridiction !")
    }

    date = today(date)

    console.time('filter list 1')
    let hr = await loadOrWarmHR(backupId, this.models)
    console.timeEnd('filter list 1')

    console.time('filter list 2')
    const preformatedAllHumanResource = preformatHumanResources(hr, date)
    console.timeEnd('filter list 2')

    console.time('filter list 3')
    let list = await getHumanRessourceList(preformatedAllHumanResource, contentieuxIds, subContentieuxIds, categoriesIds, date, endPeriodToCheck)
    console.timeEnd('filter list 3')

    console.time('filter list 4')
    const allCategories = await this.models.HRCategories.getAll()
    console.timeEnd('filter list 4')

    if (categoriesIds && categoriesIds.length === 3 && (!contentieuxIds || contentieuxIds.length === 0)) {
      // memorize first execution by user
      this.models.Logs.addLog(EXECUTE_VENTILATION, ctx.state.user.id)
    }

    let listFiltered = [...list]

    console.time('filter list 5')
    const categories = getCategoriesByUserAccess(allCategories, ctx.state.user)
    console.timeEnd('filter list 5')

    console.time('filter list 6')
    const originalReferentiel = await this.models.ContentieuxReferentiels.getReferentiels(backupId)
    console.timeEnd('filter list 6')

    console.time('filter list 7')
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
    const ids = categories.map((c) => c.id)
    hr = hr.filter((h) => h.situations.length === 0 || (h.situations || []).some((s) => ids.indexOf((s.category || { id: -1 }).id) !== -1))
    console.timeEnd('filter list 7')

    this.sendOk(ctx, {
      list: listFormated,
      allPersons: orderBy(
        hr.map((person) => {
          let situations = findAllSituations(person, this.dateSelected)
          if (situations.length === 0) {
            // if no situation in the past get to the future
            situations = findAllSituations(person, this.dateSelected, true, true)
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
            situations: situations,
            etp,
            comment: person.comment,
            etpLabel: etp ? etpLabel(etp) : null,
            categoryName: situations.length && situations[0].category ? situations[0].category.label : '',
            category: situations.length && situations[0].category ? situations[0].category : null,
            categoryRank: situations.length && situations[0].category ? situations[0].category.rank : null,
            fonctionRank: situations.length && situations[0].fonction ? situations[0].fonction.rank : null,
            fonction: situations.length && situations[0].fonction ? situations[0].fonction : null,
            indisponibilities: person.indisponibilities,
            updatedAt: person.updatedAt,
          }
        }),
        ['categoryRank', 'fonctionRank', 'lastName'],
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
  async readHr(ctx) {
    const { hrId } = ctx.params
    if (await this.model.haveAccess(hrId, ctx.state.user.id)) {
      this.sendOk(ctx, await this.model.getHrDetails(hrId))
    } else {
      this.sendOk(ctx, null)
    }
  }
}
