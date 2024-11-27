/**
 * Commentaire attribué à un magistrat
 */

export default (sequelizeInstance, Model) => {
  /**
   * Récupération des commentaires en fonction d'un type
   * @param {*} type
   * @returns
   */
  Model.getComments = async (type, juridictionId) => {
    let comments = await Model.findAll({
      attributes: ['id', 'comment', 'user_id', 'created_at', 'updated_at', 'type'],
      where: {
        type,
        hr_backup_id: juridictionId,
      },
      include: [
        {
          attributes: ['id', 'first_name', 'last_name'],
          model: Model.models.Users,
        }],
      raw: true,
    })

    for (let i = 0; i < comments.length; i++) {
      comments[i] = {
        id: comments[i].id,
        comment: comments[i].comment,
        type: comments[i].type,
        createdAt: comments[i].created_at,
        updatedAt: comments[i].updated_at,
        editor: {
          firstName: comments[i]['User.first_name'],
          lastName: comments[i]['User.last_name'],
          initials: (comments[i]['User.first_name'] || '').charAt(0) + (comments[i]['User.last_name'] || '').charAt(0),
        }
      }
    }

    return comments
  }

  /**
   * Modification d'un commentaire
   * @param {*} type
   * @param {*} juridictionId
   * @param {*} comment
   * @param {*} userId
   * @param {*} commentId
   * @returns
   */
  Model.updateComment = async (type, juridictionId, comment, userId, commentId) => {
    const com = await Model.findOne({
      where: {
        id: commentId,
        type,
        hr_backup_id: juridictionId,
      },
    })

    if (com) {
      await com.update({ comment })
    } else {
      await Model.create({ comment, type, hr_backup_id: juridictionId, user_id: userId })
    }
  }

  /**
  * Suppression du commentaire d'une fiche
  * @param {*} commentId
  * @param {*} juridictionId
  * @returns
  */
  Model.deleteComment = async (commentId, juridictionId) => {
    const com = await Model.findOne({
      where: {
        id: commentId,
        hr_backup_id: juridictionId,
      },
    })

    if (com) {
      await com.destroy()
    }
  }
  /**
   * Récupération du nombre de commentaire par contentieux
   * @param {*} contId
   * @returns
   */
  Model.getNbConId = async (contId) => 
    await Model.count({
      where: {
        type: "activities_"+contId,
      },
    })

  return Model
}
