require('dotenv').config()

module.exports = {
  up: async (queryInterface, Sequelize, models) => {
    if (process.env.TYPE_ID === 1) {
      await models.Users.create(
        {
          email: 'ruskov@a-just.fr',
          first_name: 'François-Xavier',
          last_name: 'Montigny',
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
