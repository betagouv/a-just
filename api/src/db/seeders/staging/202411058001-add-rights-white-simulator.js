const { USER_ACCESS_WHITE_SIMULATOR, USER_ACCESS_SIMULATOR } = require('../../../constants/access')

module.exports = {
  up: async (queryInterface, Sequelize, models) => {
    const users = await models.UsersAccess.findAll({
      attributes: ['user_id'],
      where: {
        access_id: USER_ACCESS_SIMULATOR,
      },
      raw: true,
    })

    for (let i = 0; i < users.length; i++) {
      await models.UsersAccess.create({
        user_id: users[i]['user_id'],
        access_id: USER_ACCESS_WHITE_SIMULATOR,
      })
    }
  },
  down: (/*queryInterface , Sequelize*/) => {},
}
