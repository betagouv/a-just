export default (sequelizeInstance, Model) => {
  Model.getUserJuriction = async (userId) => {
    const list = await Model.findAll({
      attributes: ['id', 'user_id', 'juridiction_id'],
      where: {
        user_id: userId,
      },
      include: [{
        attributes: ['id', 'label'],
        model: Model.models.Juridictions,
      }],
      raw: true,
    })

    for(let i = 0; i < list.length; i++) {
      list[i] = {
        juridiction_id: list[i]['Juridiction.id'],
        label: list[i]['Juridiction.label'],
      }
    }

    return list
  }

  Model.updateJuridictions = async (userId, juridictionIds) => {
    await Model.destroy({
      where: {
        user_id: userId,
      },
      force: true,
    })

    for(let i = 0; i < juridictionIds.length; i++) {
      await Model.create({
        user_id: userId,
        juridiction_id: juridictionIds[i],
      })
    }

  }

  return Model
}