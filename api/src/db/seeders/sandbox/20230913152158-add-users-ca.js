require('dotenv').config()

module.exports = {
  up: async (queryInterface, Sequelize, models) => {
    if (process.env.TYPE_ID === 1)
      await models.Users.create(
        {
          email: 'jimmy2fois@a-just.fr',
          first_name: 'JJ',
          last_name: 'CC',
          password: '123456',
          status: 1,
          role: 2,
        },
        true,
      )
  },
  down: (/*queryInterface , Sequelize*/) => {
  },
}
