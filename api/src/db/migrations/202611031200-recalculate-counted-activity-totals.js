module.exports = {
  up: async (queryInterface, Sequelize, models) => {
    // Répare aussi les totaux des mois déjà importés avant la prise en compte de « Compter ».
    const excluded = await models.ContentieuxReferentiels.findAll({
      attributes: ['parent_id'],
      where: {
        parent_id: { [Sequelize.Op.ne]: null },
        [Sequelize.Op.or]: [{ compter: false }, { compter: null }],
      },
      raw: true,
    })

    for (const parentId of new Set(excluded.map((ref) => ref.parent_id))) {
      await models.Activities.recalculateTotalsByContentieux(parentId)
    }
  },
  down: async () => {},
}
