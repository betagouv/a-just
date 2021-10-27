export default (sequelizeInstance, Model) => {
  Model.getCurrentHr = async () => {
    const list = await Model.findAll({
      attributes: ['id', 'first_name', 'last_name', 'etp'],
      where: {
        enable: true,
      },
      include: [{
        attributes: ['label'],
        model: Model.models.HRCategories,
      }, {
        attributes: ['label'],
        model: Model.models.HRFonctions,
      }],
      raw: true,
    })

    for(let i = 0; i < list.length; i++) {
      list[i] = {
        id: list[i].id,
        etp: list[i].etp,
        firstName: list[i].first_name,
        lastName: list[i].last_name,
        category: {
          label: list[i]['HRCategories.label'],
        },
        fonction: {
          label: list[i]['HRFonctions.label'],
        },
        activities: await Model.models.HRVentilations.getActivitiesByHR(list[i].id),
      }
    }

    return list
  }

  return Model
}