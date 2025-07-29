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
      attributes: ["id", "comment", "user_id", "created_at", "updated_at"],
      where: {
        human_id: hrId,
      },
      include: [
        {
          attributes: ["id", "first_name", "last_name"],
          model: Model.models.Users,
        },
      ],
      raw: true,
    });

    for (let i = 0; i < comments.length; i++) {
      comments[i] = {
        commentId: comments[i].id,
        comment: comments[i].comment,
        user_id: comments[i].user_id,
        createdAt: comments[i].created_at,
        updatedAt: comments[i].updated_at,
        editorId: comments[i]["User.id"],
        editorFirstName: comments[i]["User.first_name"],
        editorLastName: comments[i]["User.last_name"],
        editorInitials:
          (comments[i]["User.first_name"] || "").charAt(0) +
          (comments[i]["User.last_name"] || "").charAt(0),
      };
    }

    return comments;
  };

  /**
   * Récupère le dernier commentaire en date
   * @param {*} id
   * @returns
   */
  Model.getLastComment = async (hrId) => {
    let com = await Model.findOne({
      attributes: ["id", "comment", "user_id", "created_at", "updated_at"],
      where: {
        human_id: hrId,
      },
      order: [["createdAt", "DESC"]],
      raw: true,
    });

    if (com) {
      com = {
        commentId: com.id,
        comment: com.comment,
        user_id: com.user_id,
        createdAt: com.created_at,
        updatedAt: com.updated_at,
        editorId: com["User.id"],
        editorFirstName: com["User.first_name"],
        editorLastName: com["User.last_name"],
        editorInitials:
          (com["User.first_name"] || "").charAt(0) +
          (com["User.last_name"] || "").charAt(0),
      };
    }

    return com;
  };

  /**
   * Récupération d'un commentaire d'une fiche
   * @param {*} hrId
   * @returns
   */
  Model.getCommentById = async (id) => {
    let com = await Model.findOne({
      attributes: ["id", "comment", "user_id", "created_at", "updated_at"],
      where: {
        id,
      },
      include: [
        {
          attributes: ["id", "first_name", "last_name"],
          model: Model.models.Users,
        },
      ],
      raw: true,
    });

    if (com) {
      com = {
        commentId: com.id,
        comment: com.comment,
        user_id: com.user_id,
        createdAt: com.created_at,
        updatedAt: com.updated_at,
        editorId: com["User.id"],
        editorFirstName: com["User.first_name"],
        editorLastName: com["User.last_name"],
        editorInitials:
          (com["User.first_name"] || "").charAt(0) +
          (com["User.last_name"] || "").charAt(0),
      };
    }

    return com;
  };

  /**
   * Modification du commentaire d'une fiche
   * @param {*} hrId
   * @param {*} comment
   * @returns
   */
  Model.updateComment = async (hrId, comment, userId, commentId) => {
    let com = await Model.findOne({
      where: {
        id: commentId,
        human_id: hrId,
      },
    });

    if (com) {
      com = await com.update({
        comment,
        user_id: userId === -1 ? null : userId,
      });
    } else {
      com = await Model.create({
        comment,
        human_id: hrId,
        user_id: userId === -1 ? null : userId,
      });
    }

    // update date of backup
    await Model.models.HumanResources.updateById(hrId, {
      updated_at: new Date(),
    });

    await Model.models.HumanResources.getHr(hrId);

    return com.dataValues.updatedAt;
  };

  /**
   * Modification du commentaire d'une fiche
   * @param {*} hrId
   * @param {*} comment
   * @returns
   */
  Model.deleteComment = async (commentId, hrId) => {
    let com = await Model.findOne({
      where: {
        id: commentId,
      },
    });

    if (!com) {
      return new Date();
    }

    await Model.destroyById(commentId);

    // update date of backup
    await Model.models.HumanResources.updateById(hrId, {
      updated_at: new Date(),
    });

    await Model.models.HumanResources.getHr(hrId);

    return com.dataValues.updatedAt;
  };

  return Model;
};
