import Route, { Access } from './Route'
import { Types } from '../utils/types'
import { csvToArrayJson } from '../utils/csv'
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs'
import { join } from 'path'
import config from 'config'

/**
 * Route des imports
 */
export default class RouteImports extends Route {
  /**
   * Constructeur
   * @param {*} params
   */
  constructor (params) {
    super({ ...params, model: 'HumanResources' })
  }

  /**
   * Interface qui permet d'importer une liste de fiche
   * @param {*} file
   */
  @Route.Post({
    bodyType: Types.object().keys({
      file: Types.string(),
    }),
    accesses: [Access.isAdmin],
  })
  async importHr (ctx) {
    const { file } = this.body(ctx)
    const arrayOfHR = await csvToArrayJson(file ? file : readFileSync(ctx.request.files.file.path, 'utf8'), {
      delimiter: ';',
    })
    await this.model.importList(arrayOfHR)
    this.sendOk(ctx, 'OK')
  }

  /**
   * Interface pour importer une liste de contentieux niveau 3 et 4 et indispo
   * @param {*} file
   */
  @Route.Post({
    bodyType: Types.object().keys({
      file: Types.string(),
    }),
    accesses: [Access.isAdmin],
  })
  async importReferentiel (ctx) {
    const { file } = this.body(ctx)
    const arrayOfHR = await csvToArrayJson(file ? file : readFileSync(ctx.request.files.file.path, 'utf8'), {
      delimiter: ';',
    })
    const result = await this.model.models.ContentieuxReferentiels.importList(arrayOfHR)
    if (!existsSync(join(__dirname, '../public/tmp'))) {
      mkdirSync(join(__dirname, '../public/tmp'), { recursive: true })
    }
    writeFileSync(join(__dirname, '../public/tmp/update-referentiel.json'), JSON.stringify(result))
    this.sendOk(ctx, `${config.serverUrl}/public/tmp/update-referentiel.json`)
  }

  /**
   * Route des activités pour une juridiction
   * @param {*} backupId
   * @param {*} file
   */
  @Route.Post({
    bodyType: Types.object().keys({
      backupId: Types.number(),
      file: Types.string(),
    }),
    accesses: [Access.isAdmin],
  })
  async importActivities (ctx) {
    const { backupId, file } = this.body(ctx)

    const arrayOfHR = await csvToArrayJson(file ? file : readFileSync(ctx.request.files.file.path, 'utf8'), {
      delimiter: ',',
    })
    await this.model.models.Activities.importList(arrayOfHR, backupId)
    this.sendOk(ctx, 'OK')
  }

  /**
   * Route des activités pour importer une liste de juridiction
   * @param {*} file
   */
  @Route.Post({
    bodyType: Types.object().keys({
      file: Types.string(),
    }),
    accesses: [Access.isAdmin],
  })
  async importAllActivities (ctx) {
    const { file } = this.body(ctx)

    const arrayOfHR = await csvToArrayJson(file ? file : readFileSync(ctx.request.files.file.path, 'utf8'), {
      delimiter: ',',
    })
    await this.model.models.Activities.importMultipleJuridictions(arrayOfHR)
    this.sendOk(ctx, 'OK')
  }
}
