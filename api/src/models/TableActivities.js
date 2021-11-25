export default (sequelizeInstance, Model) => {
  Model.getAll = async () => {
    const list = await Model.findAll({
      attributes: ['periode', 'entrees', 'sorties', 'stock'],
      include: [{
        model: Model.models.ContentieuxReferentiels,
      }],
      raw: true,
    })
    
    for(let i = 0; i < list.length; i++) {
      /*const { mainTitle, title } = await Model.models.ContentieuxReferentiels.getMainLabel(list[i].contentieux)
      list[i].group = title
      list[i].mainCategory = mainTitle*/
    }

    return list
  }

  return Model
}