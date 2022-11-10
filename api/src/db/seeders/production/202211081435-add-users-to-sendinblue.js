const { sentEmailSendinblueUserList } = require('../../../utils/email')

module.exports = {
  up: async (queryInterface, Sequelize, models) => {
    const users = await models.Users.findAll()

    for(let i = 0; i < users.length; i++) {
      await sentEmailSendinblueUserList(users[i].dataValues)
    }
  },
  down: (/*queryInterface , Sequelize*/) => {
  },
}
