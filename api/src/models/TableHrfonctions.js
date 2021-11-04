export default (sequelizeInstance, Model) => {
  Model.getAll = async () => {
    return await Model.findAll({
      attributes: ['id', 'code', 'label', 'rank'],
      order: ['rank'],
    })
  }

  return Model
}