export default (sequelizeInstance, Model) => {
  Model.getCurrentHr = async () => {
    const list = await Model.findAll({
      attributes: ['id', 'first_name', 'last_name'],
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