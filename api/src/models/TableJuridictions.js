export default (sequelizeInstance, Model) => {
  Model.getAll = async () => {
    const list = await Model.findAll({
      attributes: ['id', 'label', ['cour_appel', 'courAppel'], ['long_name', 'longName'], ['image_url', 'imageUrl']],
      raw: true,
    })

    return list
  }

  return Model
}