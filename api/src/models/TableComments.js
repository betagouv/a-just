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
        },
      ],
      raw: true,
      order: [['created_at', 'desc']],
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
        },
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
      await Model.create({
        comment,
        type,
        hr_backup_id: juridictionId,
        user_id: userId,
      })
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
  Model.getNbConId = async (contId, backupId) =>
    await Model.count({
      where: {
        type: 'activities_' + contId,
        hr_backup_id: backupId,
      },
    })

  Model.getNbByConIds = async (contentieuxIds, hrBackupId) => {
    if (!Array.isArray(contentieuxIds) || contentieuxIds.length === 0) return []

    return await sequelizeInstance.query(
      `
        SELECT
          REGEXP_REPLACE(type, 'activities_', '')::int AS contentieuxId,
          COUNT(*) AS nb
        FROM "Comments"
        WHERE
          type SIMILAR TO 'activities_(%)'
          AND REGEXP_REPLACE(type, 'activities_', '')::int IN (:contentieuxIds)
          AND hr_backup_id = :hrBackupId
        GROUP BY contentieuxId
        `,
      {
        replacements: {
          contentieuxIds,
          hrBackupId,
        },
        type: sequelizeInstance.QueryTypes.SELECT,
      },
    )
  }

  Model.getNbByActivityTypes = async (contentieuxIds, hrBackupId) => {
    const types = contentieuxIds.map((id) => `activities_${id}`)

    const rows = await Model.sequelize.query(
      `
      SELECT type, COUNT(*) AS nb
      FROM "Comments"
      WHERE hr_backup_id = :hrBackupId AND type IN (:types)
      GROUP BY type
      `,
      {
        replacements: { types, hrBackupId },
        type: Model.sequelize.QueryTypes.SELECT,
      },
    )

    // Construction du Map avec contentieuxId comme clé
    return new Map(
      rows.map(({ type, nb }) => {
        const match = type.match(/^activities_(\d+)$/)
        return [parseInt(match[1], 10), parseInt(nb, 10)]
      }),
    )
  }

  return Model
}
