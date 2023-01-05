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
    const com = await Model.findOne({
      attributes: ['comment', ['updated_at', 'updatedAt']],
      where: {
        human_id: hrId,
      },
      raw: true,
    })

    return com || { comment: '', updatedAt: null }
  }

  /**
   * Modification du commentaire d'une fiche
   * @param {*} hrId
   * @param {*} comment
   * @returns
   */
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

    // save cache
    await Model.models.HumanResources.getHr(hrId)

    return com.dataValues.updatedAt
  }

  return Model
}
