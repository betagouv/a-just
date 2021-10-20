export default (sequelizeInstance, Model) => {
  Model.getMainTitles = async () => {
    const list = await Model.findAll({
      attributes: [['niveau_3', 'label']],
      group: ['niveau_3'],
      raw: true,
    })

    return list
  }

  return Model
}