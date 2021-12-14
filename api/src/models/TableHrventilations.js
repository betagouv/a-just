export default (sequelizeInstance, Model) => {
  Model.getActivitiesByHR = async (hrId, backupId) => {
    const list = await Model.findAll({
      attributes: ['id', 'rh_id', 'nac_id', 'percent', 'date_start', 'date_stop'],
      where: {
        rh_id: hrId,
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
        percent: list[i].percent,
        referentielId: list[i]['ContentieuxReferentiel.id'],
        label: list[i]['ContentieuxReferentiel.label'],
        dateStart: list[i].date_start,
        dateStop: list[i].date_stop,
      }
    }

    return list
  }

  return Model
}