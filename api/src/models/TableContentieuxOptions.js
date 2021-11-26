import { snakeToCamelArray } from '../utils/utils'

export default (sequelizeInstance, Model) => {
  Model.getAll = async () => {
    const list = snakeToCamelArray(await Model.findAll({
      attributes: ['juridiction_id', 'contentieux_id', 'average_processing_time'],
      raw: true,
    }))

    return list
  }

  return Model
}