export default (sequelizeInstance, Model) => {
  Model.getAll = async () => {
    const list = await Model.findAll({
      attributes: ['id', 'label', ['cour_appel', 'courAppel']],
      raw: true,
    })

    return list
  }

  return Model
}