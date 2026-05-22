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
      const items = await models.HRIndisponibilities.findAll({
        where: {
          nac_id: indispoASA.id,
        },
      })

      for (let i = 0; i < items.length; i++) {
        await items[i].update({
          nac_id: indispoAutreAbsenteisme.id,
        })
      }

      await indispoASA.destroy()
    }
  },
  down: (/*queryInterface, Sequelize*/) => { },
}
