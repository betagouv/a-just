import Route, { Access } from './Route'
import { Types } from '../utils/types'

/**
 * Route des news
 */
export default class RouteNews extends Route {
  // model de BDD
  model

  /**
   * Constructeur
   * @param {*} params
   */
  constructor(params) {
    super(params)

    this.model = params.models.News
  }

  /**
   * Interface de la dernière news pour un utilisateur
   */
  @Route.Get()
  async last(ctx) {
    if (!ctx.state.user) {
      this.sendOk(ctx, null)
      return
    }

    const lastNews = await this.model.getLastActiveNews(ctx.state.user.id)

    this.sendOk(ctx, lastNews)
  }

  /**
   * Interface qui informe qui un utilisateur ferme une news
   * @param {*} id
   */
  @Route.Post({
    bodyType: Types.object().keys({
      id: Types.any(),
    }),
    accesses: [Access.isLogin],
  })
  async onClose(ctx) {
    const { id } = this.body(ctx)
    await this.models.NewsUserLog.userCloseEvent(ctx.state.user.id, id)

    this.sendOk(ctx, 'OK')
  }

  /**
   * Interface de toutes les news disponibles
   */
  @Route.Get({
    accesses: [Access.isAdmin],
  })
  async getAll(ctx) {
    this.sendOk(ctx, await this.model.getAll())
  }

  /**
   * Interface qui permet de modifier ou de créer une nouvelle news
   * @param {*} id
   * @param {*} html
   * @param {*} icon
   * @param {*} backgroundColor
   * @param {*} textColor
   * @param {*} actionButtonText
   * @param {*} actionButtonUrl
   * @param {*} actionButtonColor
   * @param {*} dateStart
   * @param {*} dateStop
   * @param {*} enabled
   */
  @Route.Post({
    bodyType: Types.object().keys({
      id: Types.number(),
      html: Types.string(),
      icon: Types.string(),
      backgroundColor: Types.string(),
      textColor: Types.string(),
      actionButtonText: Types.string(),
      actionButtonUrl: Types.string(),
      actionButtonColor: Types.string(),
      dateStart: Types.date(),
      dateStop: Types.date(),
      enabled: Types.boolean(),
    }),
    accesses: [Access.isAdmin],
  })
  async updateCreate(ctx) {
    if (this.model.updateCreate(this.body(ctx))) {
      this.sendOk(ctx, 'OK')
    } else {
      this.sendOk(ctx, null)
    }
  }

  /**
   * Interface qui permet de supprimer une news
   * @param {*} newsId
   */
  @Route.Post({
    bodyType: Types.object().keys({
      newsId: Types.number().required(),
    }),
    accesses: [Access.isAdmin],
  })
  async remove(ctx) {
    const { newsId } = this.body(ctx)
    if (await this.model.destroyById(newsId)) {
      this.sendOk(ctx, 'OK')
    } else {
      this.sendOk(ctx, null)
    }
  }
}
