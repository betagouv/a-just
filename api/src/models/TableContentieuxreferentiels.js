export default (sequelizeInstance, Model) => {
  Model.getMainTitles = async () => {
    const list = await Model.findAll({
      attributes: ['id', ['niveau_3', 'label']],
      group: ['niveau_3', 'id'],
      raw: true,
    })

    return list
  }

  return Model
}