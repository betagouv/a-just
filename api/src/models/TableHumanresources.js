export default (sequelizeInstance, Model) => {
  Model.getCurrentHr = async () => {
    const list = await Model.findAll({
      attributes: ['id', 'first_name', 'last_name', 'etp'],
      where: {
        enable: true,
      },
      include: [{
        attributes: ['label'],
        model: Model.models.HRRoles,
      }, {
        attributes: ['label'],
        model: Model.models.HRPositions,
      }],
      raw: true,
    })

    console.log(list)
    for(let i = 0; i < list.length; i++) {
      list[i] = {
        id: list[i].id,
        etp: list[i].etp,
        firstName: list[i].first_name,
        lastName: list[i].last_name,
        role: {
          label: list[i]['HRRole.label'],
        },
        position: {
          label: list[i]['HRPosition.label'],
        },
      }
    }

    return list
  }

  return Model
}