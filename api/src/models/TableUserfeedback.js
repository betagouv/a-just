/**
 * Avis utilisateur sur le produit
 */

import { Op } from 'sequelize'

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

  Model.getAll = async () => {
    const rows = await Model.findAll({
      attributes: ['id', 'user_id', 'rating', 'comment', 'page', ['created_at', 'createdAt']],
      include: [
        {
          attributes: ['email', 'first_name', 'last_name'],
          model: Model.models.Users,
        },
      ],
      order: [['created_at', 'DESC']],
      raw: true,
    })

    return rows.map((row) => ({
      id: row.id,
      rating: row.rating,
      comment: row.comment,
      page: row.page,
      createdAt: row.createdAt,
      user: {
        id: row.user_id,
        email: row['User.email'],
        firstName: row['User.first_name'],
        lastName: row['User.last_name'],
      },
    }))
  }

  Model.getStats = async () => {
    const { sequelize } = Model

    const total = await Model.count()

    const avgRow = await Model.findOne({
      attributes: [[sequelize.fn('AVG', sequelize.col('rating')), 'average']],
      raw: true,
    })

    const withComment = await Model.count({
      where: {
        [Op.and]: [
          { comment: { [Op.ne]: null } },
          sequelize.where(sequelize.fn('TRIM', sequelize.col('comment')), { [Op.ne]: '' }),
        ],
      },
    })

    const byRatingRows = await Model.findAll({
      attributes: ['rating', [sequelize.fn('COUNT', sequelize.col('id')), 'count']],
      group: ['rating'],
      order: [['rating', 'ASC']],
      raw: true,
    })

    const byRating = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
    byRatingRows.forEach(({ rating, count }) => {
      byRating[rating] = parseInt(count, 10)
    })

    const byMonth = await Model.findAll({
      attributes: [
        [sequelize.fn('TO_CHAR', sequelize.col('created_at'), 'YYYY-MM'), 'month'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
      ],
      group: [sequelize.fn('TO_CHAR', sequelize.col('created_at'), 'YYYY-MM')],
      order: [[sequelize.fn('TO_CHAR', sequelize.col('created_at'), 'YYYY-MM'), 'DESC']],
      raw: true,
    })

    const topPages = await Model.findAll({
      attributes: ['page', [sequelize.fn('COUNT', sequelize.col('id')), 'count']],
      where: {
        page: {
          [Op.and]: [
            { [Op.ne]: null },
            sequelize.where(sequelize.fn('TRIM', sequelize.col('page')), { [Op.ne]: '' }),
          ],
        },
      },
      group: ['page'],
      order: [[sequelize.fn('COUNT', sequelize.col('id')), 'DESC']],
      limit: 10,
      raw: true,
    })

    return {
      total,
      average: avgRow?.average ? Math.round(parseFloat(avgRow.average) * 10) / 10 : 0,
      withComment,
      withoutComment: total - withComment,
      byRating,
      byMonth: byMonth.map(({ month, count }) => ({
        month,
        count: parseInt(count, 10),
      })),
      topPages: topPages.map(({ page, count }) => ({
        page,
        count: parseInt(count, 10),
      })),
    }
  }

  return Model
}
