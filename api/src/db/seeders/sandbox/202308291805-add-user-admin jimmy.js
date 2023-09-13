module.exports = {
  up: async (queryInterface, Sequelize, models) => {
    if (process.env.TYPE_ID === 1) {
      await models.Users.create(
        {
          email: 'jimmy.chevallier2@a-just.fr',
          first_name: 'Jimmy',
          last_name: 'CR',
          password: '123456',
          status: 1,
          role: 1,
        },
        true,
      )
    }
  },
  down: (/*queryInterface , Sequelize*/) => { },
}
