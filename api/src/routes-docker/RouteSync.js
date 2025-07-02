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
    }),
  })
  async updateAgent(ctx) {
    const { agentId, from } = this.body(ctx)

    if (from !== os.hostname()) {
      await this.models.HumanResources.removeCacheAgent(agentId)
      const agent = await this.models.HumanResources.getHr(agentId)
      await this.models.HumanResources.removeCacheByUser(agentId, agent.backup_id)
    }

    this.sendOk(ctx, os.hostname())
  }
}
