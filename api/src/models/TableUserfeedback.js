/**
 * Avis utilisateur sur le produit
 */

import { differenceInMonths } from 'date-fns'
import { Op } from 'sequelize'
import { MIN_MONTHS_FOR_FEEDBACK } from '../constants/feedback'

/**
 * Modèle de feedback utilisateur
 * @param {Sequelize} sequelizeInstance - Instance de Sequelize
 * @param {Model} Model - Modèle de feedback utilisateur
 * @returns {Model} Modèle de feedback utilisateur
 */
export default (sequelizeInstance, Model) => {
    /**
     * Vérifie si l'utilisateur a déjà répondu au feedback
     * @param {number} userId - ID de l'utilisateur
     * @returns {Promise<Model>} Promise contenant le feedback de l'utilisateur
     */
    Model.hasResponded = async (userId) => {
        return Model.findOne({
            where: {
                user_id: userId,
            },
        })
    }

    /**
     * Récupère le statut du feedback de l'utilisateur
     * @param {number} userId - ID de l'utilisateur
     * @returns {Promise<Object>} Promise contenant le statut du feedback de l'utilisateur
     */
    Model.getStatus = async (userId) => {
        const [feedback, user] = await Promise.all([
            Model.hasResponded(userId),
            Model.models.Users.findOne({
                attributes: ['created_at'],
                where: { id: userId },
                raw: true,
            }),
        ])

        const accountCreatedAt = user.created_at ? new Date(user.created_at) : null
        const eligibleForFeedback = accountCreatedAt ? differenceInMonths(new Date(), accountCreatedAt) >= MIN_MONTHS_FOR_FEEDBACK : false

        return {
            hasResponded: !!feedback,
            eligibleForFeedback,
        }
    }

    /**
     * Soumet un feedback pour un utilisateur
     * @param {number} userId - ID de l'utilisateur
     * @param {Object} feedback - Objet contenant le feedback
     * @param {number} feedback.rating - Note du feedback
     * @param {string} feedback.comment - Commentaire du feedback
     * @param {string} feedback.page - Page du feedback
     * @returns {Promise<Model>} Promise contenant le feedback soumis
     */
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

    /**
     * Récupère tous les feedbacks
     * @returns {Promise<Array<Object>>} Promise contenant tous les feedbacks
     */
    Model.getAll = async () => {
        const rows = await Model.findAll({
            attributes: ['id', 'user_id', 'rating', 'comment', 'page', ['created_at', 'createdAt']],
            include: [{
                attributes: ['email', 'first_name', 'last_name'],
                model: Model.models.Users,
            },],
            order: [
                ['created_at', 'DESC']
            ],
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

    /**
     * Récupère les statistiques des feedbacks
     * @returns {Promise<Object>} Promise contenant les statistiques des feedbacks
     */
    Model.getStats = async () => {
        const { sequelize } = Model

        const total = await Model.count()

        const avgRow = await Model.findOne({
            attributes: [
                [sequelize.fn('AVG', sequelize.col('rating')), 'average']
            ],
            raw: true,
        })

        const withComment = await Model.count({
            where: {
                [Op.and]: [{
                    comment: {
                        [Op.ne]: null
                    }
                },
                sequelize.where(sequelize.fn('TRIM', sequelize.col('comment')), {
                    [Op.ne]: ''
                }),
                ],
            },
        })

        const byRatingRows = await Model.findAll({
            attributes: ['rating', [sequelize.fn('COUNT', sequelize.col('id')), 'count']],
            group: ['rating'],
            order: [
                ['rating', 'ASC']
            ],
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
            order: [
                [sequelize.fn('TO_CHAR', sequelize.col('created_at'), 'YYYY-MM'), 'DESC']
            ],
            raw: true,
        })

        const topPages = await Model.findAll({
            attributes: ['page', [sequelize.fn('COUNT', sequelize.col('id')), 'count']],
            where: {
                page: {
                    [Op.and]: [{
                        [Op.ne]: null
                    },
                    sequelize.where(sequelize.fn('TRIM', sequelize.col('page')), {
                        [Op.ne]: ''
                    }),
                    ],
                },
            },
            group: ['page'],
            order: [
                [sequelize.fn('COUNT', sequelize.col('id')), 'DESC']
            ],
            limit: 10,
            raw: true,
        })

        return {
            total,
            average: avgRow.average ? Math.round(parseFloat(avgRow.average) * 10) / 10 : 0,
            withComment,
            withoutComment: total - withComment,
            byRating: byRating,
            byMonth: byMonth.map(({ month, count }) => ({ month, count: parseInt(count, 10) })),
            topPages: topPages.map(({ page, count }) => ({ page, count: parseInt(count, 10) })),
        }
    }

    return Model
}