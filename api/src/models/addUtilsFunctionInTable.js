import { ErrorApp } from 'koa-smart'

import sequelizeTransforms from 'sequelize-transforms'

export const customSequelizeTransforms = {
  transformToNullIfEmpty: (val, definition) => {
    if (definition.transformToNullIfEmpty && !val) {
      return null
    }
    return val
  },
}

export function addUtilsFunctionInTable (Table, sequelizeInstance) {
  sequelizeTransforms(Table, customSequelizeTransforms)

  Table.throw = (status, message) => {
    throw new ErrorApp(status, message, true)
  }
  Table.throwBadRequest = error => {
    Table.throw(400, error || 'Bad request')
  }
  Table.throwUnauthorized = error => {
    Table.throw(401, error || 'Unauthorized')
  }
  Table.throwForbidden = error => {
    Table.throw(403, error || 'Forbidden')
  }
  Table.throwNotFound = error => {
    Table.throw(403, error || 'Not found')
  }

  Table.assert = (condition, status, message) => {
    if (!condition) Table.throw(status, message)
  }
  Table.assertBadRequest = (condition, error) => {
    if (!condition) Table.throwBadRequest(error)
  }
  Table.assertUnauthorized = (condition, error) => {
    if (!condition) Table.throwUnauthorized(error)
  }
  Table.assertForbidden = (condition, error) => {
    if (!condition) Table.throwForbidden(error)
  }
  Table.assertNotFound = (condition, error) => {
    if (!condition) Table.throwNotFound(error)
  }

  Table.findById = async (id, options = {}) => {
    options.where = options.where || {}
    options.where.id = id
    return Table.findOne(options)
  }

  Table.findByUuid = async (uuid, options = {}) => {
    options.where = options.where || {}
    options.where.uuid = uuid
    return Table.findOne(options)
  }

  Table.updateAll = Table.update
  Table.updateOne = async (values, options) => {
    // individualHooks to allow call 'before / after' insteaceof 'beforeBulk / afterBulk'
    return Table.update(values, { ...options, individualHooks: true })
  }
  Table.updateById = async (id, values, options = {}) => {
    options.where = options.where || {}
    options.where.id = id
    return Table.updateOne(values, options)
  }
  Table.updateByUuid = async (uuid, values, options = {}) => {
    options.where = options.where || {}
    options.where.uuid = uuid
    return Table.updateOne(values, options)
  }

  Table.destroyOne = async options => {
    // individualHooks to allow call 'before / after' insteaceof 'beforeBulk / afterBulk'
    return Table.destroy({ ...options, individualHooks: true })
  }
  Table.destroyById = async (id, options) => {
    options = options || {}
    options.where = options.where || {}
    options.where.id = id
    return Table.destroyOne(options)
  }

  Table.toggle = async (option = {}, field) => {
    return Table.update(
      {
        [field]: sequelizeInstance.literal(`NOT ${field}`),
      },
      option
    )
  }
  Table.toggleById = async (id, field) => {
    return Table.toggle({ where: { id }, individualHooks: true }, field)
  }

  Table.increment = async (field, nb = 1, option = {}) => {
    return Table.update(
      {
        [field]: sequelizeInstance.literal(`${field} + ${nb}`),
      },
      option
    )
  }
  Table.incrementById = async (id, field, nb = 1) => {
    return Table.increment(field, nb, { where: { id }, individualHooks: true })
  }

  Table.deleteElem = (obj, name) => {
    if (obj.dataValues) {
      delete obj.dataValues[name]
    }
    delete obj[name]
  }
  Table.deleteElems = (obj, namesArray) => {
    namesArray.forEach(name => Table.deleteElem(obj, name))
  }
  Table.updateElem = (obj, name, value) => {
    if (obj[name]) {
      obj[name] = value
    }
    if (obj.dataValues && obj.dataValues[name]) {
      obj.dataValues[name] = value
    }
  }

  Table.deleteAll = () => {
    return Table.destroy({
      where: {},
      force: true,
    })
  }
}
