export default (sequelizeInstance, Model) => {
  Model.getAll = async (backupId) => {
    const list = await Model.findAll({
      attributes: ['id', 'average_processing_time'],
      where: {
        backup_id: backupId,
      },
      include: [{
        attributes: ['id', 'label'],
        model: Model.models.ContentieuxReferentiels,
      }],
      raw: true,
    })

    for(let i = 0; i < list.length; i++) {
      list[i] = {
        id: list[i].id,
        averageProcessingTime: list[i].average_processing_time,
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