/**
 * Commentaire attribué à un magistrat
 */

export default (sequelizeInstance, Model) => {
  /**
   * Récupération d'un commentaire d'une fiche
   * @param {*} hrId
   * @returns
   */
  Model.getComment = async (hrId) => {
    let comments = await Model.findAll({
      attributes: ['comment', 'user_id', 'created_at', 'updated_at'],
      where: {
        human_id: hrId,
      },
      include: [
        {
          attributes: ['id', 'first_name', 'last_name'],
          model: Model.models.Users,
        }],
      raw: true,
    })

    for (let i = 0; i < comments.length; i++) {
      console.log(comments[i])
      comments[i] = {
        comment: comments[i].comment,
        user_id: comments[i].user_id,
        createdAt: comments[i].created_at,
        updatedAt: comments[i].updated_at,
        editorId: comments[i]['User.id'],
        editorFirstName: comments[i]['User.first_name'],
        editorLastName: comments[i]['User.last_name'],
        editorInitials: (comments[i]['User.first_name'] || '').charAt(0) + (comments[i]['User.last_name'] || '').charAt(0),
      }
    }

    return comments //|| { comment: '', updatedAt: null }
  }

  /**
   * Modification du commentaire d'une fiche
   * @param {*} hrId
   * @param {*} comment
   * @returns
   */
  Model.updateComment = async (hrId, comment, userId) => {
    let com = await Model.findOne({
      where: {
        human_id: hrId,
      },
    })

    if (com) {
      com = await com.update({ comment, user_id: userId })
    } else {
      com = await Model.create({ comment, human_id: hrId, user_id: userId })
    }

    // update date of backup
    await Model.models.HumanResources.updateById(hrId, {
      updated_at: new Date(),
    })

    // save cache
    await Model.models.HumanResources.getHr(hrId)

    return com.dataValues.updatedAt
  }

  return Model
}
