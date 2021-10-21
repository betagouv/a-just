export default (sequelizeInstance, Model) => {
  Model.getActivitiesByHR = async (hrId) => {
    const list = await Model.findAll({
      attributes: ['id', 'rh_id', 'nac_id', 'percent'],
      where: {
        rh_id: hrId,
      },
      include: [{
        attributes: ['id', ['niveau_3', 'label']],
        model: Model.models.ContentieuxReferentiels,
      }],
      raw: true,
    })

    for(let i = 0; i < list.length; i++) {
      list[i] = {
        id: list[i].id,
        percent: list[i].percent,
        label: list[i]['ContentieuxReferentiel.label'],
      }
    }

    return list
  }

  return Model
}