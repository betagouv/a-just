module.exports = {
  up: async (queryInterface, Sequelize, models) => {
    await models.HRFonctions.create({
      code: "Att. J",
      label: "ATTACHÉ DE JUSTICE",
      rank: 200,
      category_detail: "A",
      category_id: 3,
      calculatrice_is_active: true,
      position: "Contractuel"
    })
  },
  down: (/*queryInterface , Sequelize*/) => {},
}