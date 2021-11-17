module.exports = {
  up: async (queryInterface, Sequelize, models) => {
    await models.UserJuridictions.create(
      {
        user_id: 1,
        juridiction_id: 1,
      },
      true,
    )
  },
  down: (/*queryInterface , Sequelize*/) => {
  },
}
