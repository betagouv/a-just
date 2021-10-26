export default (sequelizeInstance, Model) => {
  Model.getMainTitles = async () => {
    const list = await Model.findAll({
      attributes: ['id', ['niveau_3', 'label']],
      group: ['niveau_3', 'id'],
      raw: true,
    })

    return list
  }

  Model.getMainLabel = async (contentieux) => {
    const ref = await Model.findOne({
      attributes: ['niveau_1', 'niveau_3'],
      where: {
        niveau_4: contentieux,
      },
      raw: true,
    })

    if(ref) {
      return {
        mainTitle: ref.niveau_1,
        title: ref.niveau_3,
      }
    }

    return null
  }


  return Model
}