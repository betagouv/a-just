import config from 'config'

export default (sequelizeInstance, Model) => {
  Model.getActivitiesGrouped = async () => {
    const list = await Model.findAll({
      attributes: ['periode', 'contentieux', 'entrees', 'sorties', 'stock'],
      where: {
        juridiction_id: config.juridictionId,
      },
      raw: true,
    })
    
    for(let i = 0; i < list.length; i++) {
      const { mainTitle, title } = await Model.models.ContentieuxReferentiels.getMainLabel(list[i].contentieux)
      list[i].group = title
      list[i].mainCategory = mainTitle
    }

    return list
  }

  return Model
}