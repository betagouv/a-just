export default (sequelizeInstance, Model) => {
  Model.addHistory = async (userId, activityId) => {
    await Model.create({
      activity_id: activityId,
      user_id: userId,
    })
  }

  Model.getLastUpdate = async (listId) => {
    const listUpdated = await Model.findAll({
      attributes: ['user_id', 'updated_at'],
      where: {
        activity_id: listId,
      },
      include: [{
        model: Model.models.Users,
        attributes: ['first_name', 'last_name'],
      }],
      order: [['updated_at', 'desc']],
      limit: 1,
      raw: true,
    })
    
    if(listUpdated.length > 0) {
      return {
        user: {
          firstName: listUpdated[0]['User.first_name'],
          lastName: listUpdated[0]['User.last_name'],
        },
        date: listUpdated[0].updated_at,
      }
    }

    return null
  }

  return Model
}
