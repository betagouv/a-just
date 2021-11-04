export default (sequelizeInstance, Model) => {
  Model.createWithLabel = async (label) => {
    const creation = await Model.create({
      label,
    })

    return creation.dataValues.id
  }

  Model.lastId = async () => {
    const lastBackup = await Model.findAll({
      order: [['id', 'desc']],
      limit: 1,
    })

    return lastBackup[0].dataValues.id
  }

  Model.list = async () => {
    return await Model.findAll({
      attributes: ['id', 'label', ['created_at', 'date']],
    })
  }

  return Model
}