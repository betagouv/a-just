module.exports = {
  up: async (queryInterface, Sequelize, models) => {
    const hr = await models.HumanResources.findAll()
    const categories = await models.HRCategories.findAll()
    const fonctions = await models.HRFonctions.findAll()

    for(let i = 0; i < hr.length; i++) {
      await models.HRSitutations.create({ 
        human_id: hr[i].id,
        etp: hr[i].etp || 0,
        category_id: hr[i].hr_categorie_id || categories[0].id,
        fonction_id: hr[i].hr_fonction_id || fonctions[0].id,
        date_start: hr[i].date_entree || new Date(2021, 0, 1),
      })
    }
  },
  down: (/*queryInterface , Sequelize*/) => {
  },
}
