export default (sequelizeInstance, Model) => {
  Model.getActivitiesByHR = async (hrId, backupId, dateStop) => {
    if(dateStop) {
      dateStop = new Date(dateStop)
    }

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
      const dStart = list[i].date_start ? new Date(list[i].date_start) : null
      const dStop = list[i].date_stop ? new Date(list[i].date_stop) : null


      list[i] = {
        id: list[i].id,
        percent: list[i].percent,
        referentielId: list[i]['ContentieuxReferentiel.id'],
        label: list[i]['ContentieuxReferentiel.label'],
        dateStart: dStart && dateStop && dStart.getTime() > dateStop.getTime() ? dateStop : dStart,
        dateStop: dateStop && (!dStop || dStop.getTime() > dateStop.getTime()) ? dateStop : dStop,
      }
    }

    return list
  }

  return Model
}