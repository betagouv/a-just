module.exports = {
  up: async (queryInterface, Sequelize, models) => {
    console.log('TYPE ID', process.env.TYPE_ID)
    if (process.env.TYPE_ID === 0) {
      console.log('TYPE ID TEST', process.env.TYPE_ID)
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
