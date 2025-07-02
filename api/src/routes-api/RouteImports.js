import Route, { Access } from './Route'
import { Types } from '../utils/types'
import { csvToArrayJson } from '../utils/csv'
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs'
import { join } from 'path'
import config from 'config'
import { selfRouteToSyncJuridiction } from '../utils/docker'

/**
 * Route des imports
 */
export default class RouteImports extends Route {
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
   * Interface qui permet d'importer une liste de fiche
   * @param {*} file
   */
  @Route.Post({
    bodyType: Types.object().keys({
      file: Types.string(),
    }),
    accesses: [Access.isSuperAdmin],
  })
  async importHr(ctx) {
    const { file } = this.body(ctx)
    const arrayOfHR = await csvToArrayJson(file ? file : readFileSync(ctx.request.files.file.path, 'utf8'), {
      delimiter: ';',
    })
    const backupIds = await this.model.importList(arrayOfHR)
    for (let i = 0; i < backupIds.length; i++) {
      await selfRouteToSyncJuridiction(backupIds[i])
    }

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
    accesses: [Access.isSuperAdmin],
  })
  async importReferentiel(ctx) {
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
  async importActivities(ctx) {
    console.log('oui? import activities')
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
  async importAllActivities(ctx) {
    const { file } = this.body(ctx)
    console.log('IMPORTS - START')

    console.time('step0')
    console.time('step1')
    const arrayOfHR = await csvToArrayJson(file ? file : readFileSync(ctx.request.files.file.path, 'utf8'), {
      delimiter: ',',
    })
    console.timeEnd('step1')
    await this.model.models.Activities.importMultipleJuridictions(arrayOfHR)
    console.timeEnd('step0')
    console.log('IMPORTS - DONE')
    this.sendOk(ctx, 'OK')
  }

  /**
   * Route des activités pour vérifier la qualité des données avant import de toutes les juridictions
   * @param {*} file
   */
  @Route.Post({
    bodyType: Types.object().keys({
      file: Types.string(),
    }),
    accesses: [Access.isAdmin],
  })
  async checkDataBeforeImportAll(ctx) {
    const { file } = this.body(ctx)
    // console.log('CHECK - START')

    // console.time('step0')
    // console.time('step1')
    const arrayOfHR = await csvToArrayJson(file ? file : readFileSync(ctx.request.files.file.path, 'utf8'), {
      delimiter: ',',
    })
    // console.timeEnd('step1')
    // console.timeEnd('step0')
    // console.log('CHECK - DONE')
    this.sendOk(ctx, await this.model.models.Activities.checkDataBeforeImportAll(arrayOfHR))
  }

  /**
   * Route des activités pour vérifier la qualité des données avant import d'une seule juridiction
   * @param {*} file
   */
  @Route.Post({
    bodyType: Types.object().keys({
      backupId: Types.number(),
      file: Types.string(),
    }),
    accesses: [Access.isAdmin],
  })
  async checkDataBeforeImportOne(ctx) {
    const { backupId, file } = this.body(ctx)
    // console.log('CHECK - START')

    // console.time('step0')
    // console.time('step1')
    const arrayOfHR = await csvToArrayJson(file ? file : readFileSync(ctx.request.files.file.path, 'utf8'), {
      delimiter: ',',
    })
    // console.timeEnd('step1')
    // console.timeEnd('step0')
    // console.log('CHECK - DONE')
    this.sendOk(ctx, await this.model.models.Activities.checkDataBeforeImportOne(arrayOfHR, backupId))
  }
}
