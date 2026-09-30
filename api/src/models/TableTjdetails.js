import { groupBy } from "lodash"

export default (sequelizeInstance, Model) => {

  Model.getCle = async (backupIds) => {
    if (!Array.isArray(backupIds)) {
      backupIds = [backupIds]
    }

    const element = await Model.findAll({
      attributes: ['id', 'juridiction_id', 'category_id', 'value'],
      where: {
        juridiction_id: backupIds,
      },
      raw: true,
    })
    if (element) {
      return Object.entries(groupBy(element, 'category_id')).map(([category_id, value]) => ({
        category_id: parseInt(category_id),
        value: value.reduce((acc, curr) => {
          const parsed = Number(curr.value)
          return Number.isInteger(parsed) ? acc + parsed : acc
        }, 0)
      }))
    }
    else return null
  }

  Model.updateCle = async (juridicitionId, categoryId, value) => {
    const element = await Model.findOne({
      attributes: ['id'],
      where: {
        juridiction_id: juridicitionId,
        category_id: categoryId
      },

    })

    if (element) {
      return await element.update({ value })
    }
    else {
      return await Model.create({
        juridiction_id: juridicitionId,
        category_id: categoryId,
        value
      })
    }

  }
  return Model
}
