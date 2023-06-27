module.exports = {
  up: async (queryInterface, Sequelize, models) => {
      const team = await models.HRCategories.findOne({
        where: {
          label: 'Autour du magistrat'
        },
        raw: true,
      })

      if(team) {
        const fonctions = await models.HRFonctions.findAll({
          where: {
            category_id: team.id
          },
        })

        for(let i = 0; i < fonctions.length; i++) {
          await fonctions[i].update({
            calculatrice_is_active: true
          })
        }
      }
  },
  down: (/*queryInterface , Sequelize*/) => {},
}
