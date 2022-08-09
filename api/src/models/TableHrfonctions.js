export default (sequelizeInstance, Model) => {
  Model.getAll = async () => {
    return await Model.findAll({
      attributes: ['id', 'code', 'label', 'rank', ['category_id', 'categoryId']],
      order: ['category_id', 'rank'],
    })
  }

  return Model
}