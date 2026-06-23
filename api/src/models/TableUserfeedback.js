/**
 * Avis utilisateur sur le produit
 */

export default (sequelizeInstance, Model) => {
  Model.hasResponded = async (userId) => {
    return Model.findOne({
      where: {
        user_id: userId,
      },
    })
  }

  Model.submit = async (userId, { rating, comment, page }) => {
    const existing = await Model.hasResponded(userId)

    if (existing) {
      return existing
    }

    return Model.create({
      user_id: userId,
      rating,
      comment: comment || null,
      page: page || null,
    })
  }

  return Model
}
