export default (sequelizeInstance, Model) => {
  Model.getUserAccess = async (userId) => {
    const access = await Model.findAll({
      attributes: ['access_id'],
      where: { user_id: userId },
      raw: true,
    })

    return access.map(a => (a.access_id))
  }

  Model.updateAccess = async (userId, accessIds) => {
    await Model.destroy({
      where: {
        user_id: userId,
      },
      force: true,
    })

    for(let i = 0; i < accessIds.length; i++) {
      await Model.create({
        user_id: userId,
        access_id: accessIds[i],
      })
    }
  }

  return Model
}
