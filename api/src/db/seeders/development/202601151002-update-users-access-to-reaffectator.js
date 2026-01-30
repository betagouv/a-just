const {
  USER_ACCESS_WHITE_SIMULATOR_READER,
  USER_ACCESS_SIMULATOR_READER,
  USER_ACCESS_REAFFECTATOR_READER,
  USER_ACCESS_REAFFECTATOR_WRITER,
} = require('../../../constants/access')

module.exports = {
  up: async (queryInterface, Sequelize, models) => {
    const usersAccess = await models.UsersAccess.findAll({
      attributes: ['id', 'user_id', 'access_id'],
      where: {
        access_id: [USER_ACCESS_SIMULATOR_READER, USER_ACCESS_WHITE_SIMULATOR_READER],
      },
    })

    for (let i = 0; i < usersAccess.length; i++) {
      const hasAccessToReaffectatorReader = await models.UsersAccess.findOne({
        where: {
          user_id: usersAccess[i].dataValues.user_id,
          access_id: USER_ACCESS_REAFFECTATOR_READER,
        },
      })
      if (!hasAccessToReaffectatorReader) {
        await models.UsersAccess.create({ user_id: usersAccess[i].dataValues.user_id, access_id: USER_ACCESS_REAFFECTATOR_READER })
      }

      const hasAccessToReaffectatorWriter = await models.UsersAccess.findOne({
        where: {
          user_id: usersAccess[i].dataValues.user_id,
          access_id: USER_ACCESS_REAFFECTATOR_WRITER,
        },
      })
      if (!hasAccessToReaffectatorWriter) {
        await models.UsersAccess.create({ user_id: usersAccess[i].dataValues.user_id, access_id: USER_ACCESS_REAFFECTATOR_WRITER })
      }
    }
  },
  down: (/*queryInterface , Sequelize*/) => {},
}
