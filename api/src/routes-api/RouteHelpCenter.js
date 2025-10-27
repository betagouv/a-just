import Route, { Access } from './Route'
import { Types } from '../utils/types'
import { EXECUTE_HELPCENTER, EXECUTE_HELPCENTER_LINK, EXECUTE_HELPCENTER_SEARCH } from '../constants/log-codes'
import { Client } from '@hubspot/api-client'
import config from 'config'
import { TEMPLATE_CALL_ME_BACK, TEMPLATE_NOTIFICATION } from '../constants/email'
import { sentEmail } from '../utils/email'

/**
 * Route des juridictions
 */
export default class RouteCentreDAide extends Route {
  // model de BDD
  model

  /**
   * Constructeur
   * @param {*} params
   */
  constructor (params) {
    super(params)
  }

  /**
   * Log cente
   * @param {*} node
   * @param {*} juridictionId
   */
  @Route.Post({
    bodyType: Types.object().keys({
      value: Types.any().required(),
    }),
    accesses: [Access.isLogin],
  })
  async logDocumentationRecherche (ctx) {
    const { value } = this.body(ctx)
    await this.models.Logs.addLog(EXECUTE_HELPCENTER_SEARCH, ctx.state.user.id, { recherche: value })
    this.sendOk(ctx, 'Ok')
  }
  /**
   * Log cente
   * @param {*} node
   * @param {*} juridictionId
   */
  @Route.Post({
    bodyType: Types.object().keys({
      value: Types.any().required(),
    }),
    accesses: [Access.isLogin],
  })
  async logDocumentationLink (ctx) {
    const { value } = this.body(ctx)
    await this.models.Logs.addLog(EXECUTE_HELPCENTER_LINK, ctx.state.user.id, { url: value })
    this.sendOk(ctx, 'Ok')
  }

  /**
   * Log cente
   * @param {*} node
   * @param {*} juridictionId
   */
  @Route.Post({
    accesses: [Access.isLogin],
  })
  async logDocumentation (ctx) {
    await this.models.Logs.addLog(EXECUTE_HELPCENTER, ctx.state.user.id)
    this.sendOk(ctx, 'Ok')
  }

  /**
   * Envoyer une notification au support
   */
  @Route.Post({
    path: 'to-support',
    bodyType: Types.object().keys({
      title: Types.string().required(),
      content: Types.string().required(),
    }),
    accesses: [Access.isLogin],
  })
  async sendToSupport(ctx) {
    const { title, content } = this.body(ctx)
    
    try {
      await this.models.Notifications.toSupport(title, content)
      this.sendOk(ctx, 'Notification sent to support')
    } catch (error) {
      console.error('Failed to send notification to support:', error)
      ctx.throw(500, 'Failed to send notification')
    }
  }

  /**
   * Envoyer une alerte de latence extracteur
   */
  @Route.Post({
    path: 'extractor-latency-alert',
    bodyType: Types.object().keys({
      title: Types.string().required(),
      content: Types.string().required(),
    }),
    accesses: [Access.isLogin],
  })
  async sendExtractorLatencyAlert(ctx) {
    const { title, content } = this.body(ctx)
    
    // Check if latency alert email is configured
    if (!config.extractorLatencyAlertEmail) {
      console.warn('EXTRACTOR_LATENCY_ALERT_EMAIL not configured - skipping alert')
      this.sendOk(ctx, 'Alert skipped - email not configured')
      return
    }
    
    try {
      // Send email directly to latency alert team (not support)
      await sentEmail(
        {
          email: config.extractorLatencyAlertEmail,
        },
        TEMPLATE_NOTIFICATION,
        {
          title,
          content,
          name: 'Équipe latence',
        }
      )
      
      // Also log it for audit purposes
      await this.models.Logs.addLog('EXTRACTOR_LATENCY_ALERT', ctx.state.user.id, {
        title,
        content,
        alertEmail: config.extractorLatencyAlertEmail,
      })
      
      this.sendOk(ctx, 'Latency alert sent')
    } catch (error) {
      console.error('Failed to send extractor latency alert:', error)
      ctx.throw(500, 'Failed to send latency alert')
    }
  }

  /**
   * Poster un formulaire dans hubspot
   */
  @Route.Post({
    bodyType: Types.object().keys({
      userId: Types.number().required(),
      phoneNumber: Types.string().required(),
    }),
    accesses: [Access.isLogin],
  })
  async postFormHubspot (ctx) {
    const { userId, phoneNumber } = this.body(ctx)

    let user = await this.models.Users.findOne({
      attributes: ['id', 'email', 'first_name', 'last_name', 'tj', 'fonction'],
      where: {
        id: userId,
        status: 1,
      },
      raw: true,
    })

    if (user) {
      const str = [
        'Prénom: ' + user.first_name,
        'Nom: ' + user.last_name,
        'E-mail: ' + user.email,
        'Tj: ' + user.tj,
        'Fonction: ' + user.fonction,
        'Numéro de téléphone: ' + phoneNumber,
      ].join('\n')
      await sentEmail(
        {
          email: config.supportEmail,
        },
        TEMPLATE_CALL_ME_BACK,
        {
          info: str,
        }
      )
      const hubspotClient = new Client({ accessToken: config.hubspotToken })
      await hubspotClient.apiRequest({
        method: 'POST',
        path: '/crm/v3/objects/tickets',
        body: {
          properties: {
            hs_pipeline: '0',
            hs_pipeline_stage: '1',
            hs_ticket_priority: 'HIGH',
            hubspot_owner_id: '',
            subject: 'Un utilisateur souhaite être rappelé',
            content: str,
          },
        },
      })
      this.sendOk(ctx, 'OK')
    }
    this.sendOk(ctx, 'NOK')
  }
}
