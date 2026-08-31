import Route, { Access } from './Route'
import { Types } from '../utils/types'

/**
 * Route des groupes
 */
export default class RouteGroups extends Route {
  // model de BDD
  model

  /**
   * Constructeur
   * @param {*} params
   */
  constructor(params) {
    super(params)

    this.model = params.models.Groups
  }

  /**
   * Interface qui permet d'importer une liste de fiche
   * @param {*} file
   */
  @Route.Get({
    accesses: [Access.isAdmin],
  })
  async listGroups(ctx) {
    const groups = await this.model.listGroups()
    this.sendOk(ctx, { groups, hrbackupAlone: await this.model.listHrbackupAlone() })
  }

  /**
   * Associe une liste de juridictions à un groupe (ou les retire si groupId est null)
   */
  @Route.Post({
    bodyType: Types.object().keys({
      groupId: Types.number(),
      backupIds: Types.array().required(),
    }),
    accesses: [Access.isAdmin],
  })
  async assignHrBackups(ctx) {
    const { groupId, backupIds } = this.body(ctx)
    await this.model.assignHrBackups(groupId || null, backupIds || [])
    this.sendOk(ctx, 'Ok')
  }

  /**
   * Crée un groupe
   */
  @Route.Post({
    bodyType: Types.object().keys({
      label: Types.string().required(),
    }),
    accesses: [Access.isAdmin],
  })
  async createGroup(ctx) {
    const { label } = this.body(ctx)
    const trimmed = (label || '').trim()
    if (!trimmed) {
      ctx.throw(400, 'Le nom du groupe est requis')
    }
    this.sendOk(ctx, await this.model.createGroup(trimmed))
  }

  /**
   * Renomme un groupe
   */
  @Route.Post({
    bodyType: Types.object().keys({
      groupId: Types.number().required(),
      label: Types.string().required(),
    }),
    accesses: [Access.isAdmin],
  })
  async updateGroup(ctx) {
    const { groupId, label } = this.body(ctx)
    const trimmed = (label || '').trim()
    if (!trimmed) {
      ctx.throw(400, 'Le nom du groupe est requis')
    }
    await this.model.updateGroup(groupId, trimmed)
    this.sendOk(ctx, 'Ok')
  }

  /**
   * Supprime un groupe et retire les juridictions associées
   */
  @Route.Post({
    bodyType: Types.object().keys({
      groupId: Types.number().required(),
    }),
    accesses: [Access.isAdmin],
  })
  async removeGroup(ctx) {
    const { groupId } = this.body(ctx)
    await this.model.removeGroup(groupId)
    this.sendOk(ctx, 'Ok')
  }
}
