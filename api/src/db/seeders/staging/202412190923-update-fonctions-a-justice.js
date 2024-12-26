module.exports = {
  up: async (queryInterface, Sequelize, models) => {
    await models.HRFonctions.create({
      code: "A greffier",
      label: "A greffier",
      rank: 200,
      category_detail: "A GREFFIER",
      category_id: 2,
      calculatrice_is_active: false,
      position: "Contractuel",
      min_date_avalaible: new Date(2025,0,1, 10)
    })
  },
  down: (/*queryInterface , Sequelize*/) => {},
}