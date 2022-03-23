export default (sequelizeInstance, Model) => {
  Model.getComment = async (hrId) => {
    const com = await Model.findOne({
      attributes: ['comment', ['updated_at', 'updatedAt']],
      where: {
        human_id: hrId,
      },
      raw: true,
    })

    return com || { comment: '', updatedAt: null }
  }

  Model.updateComment = async (hrId, comment) => {
    let com = await Model.findOne({
      where: {
        human_id: hrId,
      },
    })

    if (com) {
      com = await com.update({ comment })
    } else {
      com = await Model.create({ comment, human_id: hrId })
    }

    // update date of backup
    await Model.models.HumanResources.updateById(hrId, {
      updated_at: new Date(),
    })

    return com.dataValues.updatedAt
  }

  return Model
}
