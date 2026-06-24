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

    const [totals] = await sequelize.query(
      `
      SELECT
        COUNT(*)::int AS total,
        COALESCE(AVG(rating), 0) AS average,
        COUNT(*) FILTER (WHERE comment IS NOT NULL AND TRIM(comment) <> '')::int AS "withComment",
        COUNT(*) FILTER (WHERE comment IS NULL OR TRIM(comment) = '')::int AS "withoutComment"
      FROM "UserFeedback"
      WHERE deleted_at IS NULL
      `,
      { type: sequelize.QueryTypes.SELECT },
    )

    const byRatingRows = await sequelize.query(
      `
      SELECT rating, COUNT(*)::int AS count
      FROM "UserFeedback"
      WHERE deleted_at IS NULL
      GROUP BY rating
      ORDER BY rating
      `,
      { type: sequelize.QueryTypes.SELECT },
    )

    const byRating = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
    byRatingRows.forEach(({ rating, count }) => {
      byRating[rating] = count
    })

    const byMonth = await sequelize.query(
      `
      SELECT TO_CHAR(created_at, 'YYYY-MM') AS month, COUNT(*)::int AS count
      FROM "UserFeedback"
      WHERE deleted_at IS NULL
      GROUP BY TO_CHAR(created_at, 'YYYY-MM')
      ORDER BY month DESC
      `,
      { type: sequelize.QueryTypes.SELECT },
    )

    const topPages = await sequelize.query(
      `
      SELECT page, COUNT(*)::int AS count
      FROM "UserFeedback"
      WHERE deleted_at IS NULL AND page IS NOT NULL AND TRIM(page) <> ''
      GROUP BY page
      ORDER BY count DESC
      LIMIT 10
      `,
      { type: sequelize.QueryTypes.SELECT },
    )

    return {
      total: totals.total,
      average: Math.round(parseFloat(totals.average) * 10) / 10,
      withComment: totals.withComment,
      withoutComment: totals.withoutComment,
      byRating,
      byMonth,
      topPages,
    }
  }

  return Model
}
