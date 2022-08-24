export default (sequelizeInstance, Model) => {
  Model.getAll = async () => {
    return await Model.findAll({
      attributes: ['id', 'label', 'rank'],
      order: ['rank'],
      raw: true,
    })
  }

  return Model
}