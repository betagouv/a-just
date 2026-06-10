module.exports = {
  up: async (queryInterface, Sequelize, models) => {
    const indispoASA = await models.ContentieuxReferentiels.findOne({
      where: {
        label: "Autorisation spéciale d'absence",
      },
    })

    const indispoAutreAbsenteisme = await models.ContentieuxReferentiels.findOne({
      where: {
        label: "Autre absentéisme",
      },
    })

    if (indispoASA && indispoAutreAbsenteisme) {
      await indispoASA.update({
        category: "Absentéisme",
        rank: indispoAutreAbsenteisme.rank,
      })
      await indispoAutreAbsenteisme.update({
        rank: indispoAutreAbsenteisme.rank + 1,
      })
    }
  },
  down: (/*queryInterface, Sequelize*/) => { },
}
