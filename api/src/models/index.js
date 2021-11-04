import path from 'path'
import { readdirSync, existsSync } from 'fs'
import config from 'config'
import Sequelize from 'sequelize'

import db from '../db'
import { addUtilsFunctionInTable } from './addUtilsFunctionInTable'
import { ucFirst } from '../utils/utils'

if(!config.database.url) {
  console.error(config.database)
  throw 'No database URL'
}
const dbInstance = new Sequelize(config.database.url, config.database)

function initModelsByPath (sequelizeInstance, folderPath, globalName) {
  if (global[globalName]) {
    return global[globalName]
  }
  const models = {}

  const folderDefPath = path.join(folderPath, 'definitions')
  readdirSync(folderDefPath).forEach(async (file) => {
    const createModel = require(path.join(folderDefPath, file)).default
    const model = createModel(sequelizeInstance)
    models[model.name] = model
    // add Controler
    const pathControler = path.join(folderPath, `Table${ucFirst(file.toLowerCase())}`)
    if (existsSync(pathControler)) {
      const controlerModel = require(pathControler).default
      controlerModel(sequelizeInstance, model)
    } else {
      throw `Not found ${pathControler}`
    }
  })

  for (const modelName in models) {
    if (models[modelName].associate) {
      models[modelName].models = models
      models[modelName].associate(models)
    }
    addUtilsFunctionInTable(models[modelName], sequelizeInstance)
  }
  global[globalName] = models
  return global[globalName]
}

function initModels () {
  const models = initModelsByPath(dbInstance, __dirname, 'models')
  return models
}

export default {
  instance: dbInstance,
  initModels,
  migrations: db.migrations(dbInstance),
  seeders: db.seeders(dbInstance),
}
