import { snakeToCamelArray } from '../utils/utils'

export default (sequelizeInstance, Model) => {
  Model.getMainTitles = async () => {
    const list = await Model.findAll({
      attributes: ['id', 'code_nac', 'label'],
      where: {
        parent_id: null,
      },
      raw: true,
    })

    return snakeToCamelArray(list)
  }

  return Model
}