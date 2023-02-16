const { HAS_ACCESS_TO_MAGISTRAT, HAS_ACCESS_TO_GREFFIER, HAS_ACCESS_TO_CONTRACTUEL } = require('../../../constants/access')

module.exports = {
  up: async (queryInterface, Sequelize, models) => {
    const users = await models.Users.findAll({
      attributes: ['id'],
      raw: true,
    })

    for (let i = 0; i < users.length; i++) {
      await models.UsersAccess.create({
        user_id: users[i].id,
        access_id: HAS_ACCESS_TO_MAGISTRAT,
      })
      await models.UsersAccess.create({
        user_id: users[i].id,
        access_id: HAS_ACCESS_TO_GREFFIER,
      })
      await models.UsersAccess.create({
        user_id: users[i].id,
        access_id: HAS_ACCESS_TO_CONTRACTUEL,
      })
    }
  },
  down: (/*queryInterface , Sequelize*/) => {},
}
