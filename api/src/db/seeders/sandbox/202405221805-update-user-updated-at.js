module.exports = {
  up: async (queryInterface, Sequelize, models) => {
    const users = await models.Users.findAll({
      where: {},
    })

    for (let i = 0; i < users.length; i++) {
      await users[i].update({
        updated_at: new Date(),
      })
    }
  },
  down: (/*queryInterface , Sequelize*/) => {},
}
