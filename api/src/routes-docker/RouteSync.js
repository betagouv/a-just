import Route from './Route'
import { Types } from '../utils/types'
import os from 'os'

export default class RouteSync extends Route {
  /**
   * Constructeur
   * @param {*} params
   */
  constructor(params) {
    super(params)
  }

  @Route.Post({
    bodyType: Types.object().keys({
      type: Types.string(),
      id: Types.number(),
      from: Types.string(),
    }),
  })
  async update(ctx) {
    const { type, id, from } = this.body(ctx)

    if (from !== os.hostname()) {
      switch (type) {
        case 'juridiction-agents': {
          await this.models.HumanResources.getCache(id, true)
          break
        }
      }
    }

    this.sendOk(ctx, os.hostname())
  }

  @Route.Post({
    bodyType: Types.object().keys({
      agentId: Types.number(),
      from: Types.string(),
      backupId: Types.any(),
    }),
  })
  async updateAgent(ctx) {
    const { agentId, from, backupId } = this.body(ctx)

    if (from !== os.hostname()) {
      try {
        await this.models.HumanResources.removeCacheAgent(agentId)
        await this.models.HumanResources.removeCacheByUser(agentId, backupId)
      } catch (error) {
        console.error('Error removing cache', error)
      }
    }

    this.sendOk(ctx, os.hostname())
  }
}
