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

    console.log(list)

    return list
  }

  return Model
}