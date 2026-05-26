module.exports = {
  up: async (queryInterface, Sequelize, models) => {
    const indispoDechargeSyndicale = await models.ContentieuxReferentiels.findOne({
      where: {
        label: "Décharge syndicale",
      },
    })

    const indispoAutreAbsenteisme = await models.ContentieuxReferentiels.findOne({
      where: {
        label: "Autres indisponibilités (action 99)",
      },
    })


    if (indispoDechargeSyndicale && indispoAutreAbsenteisme) {
      const items = await models.HRIndisponibilities.findAll({
        where: {
          nac_id: indispoDechargeSyndicale.id,
        },
      })

      for (let i = 0; i < items.length; i++) {
        await items[i].update({
          nac_id: indispoAutreAbsenteisme.id,
        })
      }

      await indispoDechargeSyndicale.destroy()
    }
  },
  down: (/*queryInterface, Sequelize*/) => { },
}
