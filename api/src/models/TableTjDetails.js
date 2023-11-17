export default (sequelizeInstance, Model) => {

  Model.getCle = async (juridicitionId) => {
    const element = await Model.findAll({
      attributes: ['id', 'juridiction_id', 'category_id', 'value'],
      where: {
        juridiction_id: juridicitionId,
      },
    })
    if (element) {
      return element
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
