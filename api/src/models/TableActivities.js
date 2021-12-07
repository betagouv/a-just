export default (sequelizeInstance, Model) => {
  Model.getAll = async (backupId) => {
    const list = await Model.findAll({
      attributes: ['periode', 'entrees', 'sorties', 'stock'],
      where: {
        backup_id: backupId,
      },
      include: [{
        model: Model.models.ContentieuxReferentiels,
      }],
      raw: true,
    })
    
    for(let i = 0; i < list.length; i++) {
      list[i] = {
        id: list[i].id,
        periode: list[i].periode,
        entrees: list[i].entrees,
        sorties: list[i].sorties,
        stock: list[i].stock,
        contentieux: {
          id: list[i]['ContentieuxReferentiel.id'],
          label: list[i]['ContentieuxReferentiel.label'],
        },
      }
    }

    return list
  }

  return Model
}