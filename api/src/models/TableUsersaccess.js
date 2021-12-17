export default (sequelizeInstance, Model) => {
  Model.getUserAccess = async (userId) => {
    const access = await Model.findAll({
      attributes: ['access_id'],
      where: { user_id: userId },
      raw: true,
    })

    return access.map(a => (a.access_id))
  }

  return Model
}
