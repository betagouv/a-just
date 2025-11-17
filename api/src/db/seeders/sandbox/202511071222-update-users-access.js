const {
  USER_ACCESS_DASHBOARD_READER,
  USER_ACCESS_DASHBOARD_WRITER,
  USER_ACCESS_VENTILATIONS_READER,
  USER_ACCESS_VENTILATIONS_WRITER,
  USER_ACCESS_ACTIVITIES_READER,
  USER_ACCESS_ACTIVITIES_WRITER,
  USER_ACCESS_WHITE_SIMULATOR_READER,
  USER_ACCESS_WHITE_SIMULATOR_WRITER,
  USER_ACCESS_SIMULATOR_WRITER,
  USER_ACCESS_SIMULATOR_READER,
  USER_ACCESS_CALCULATOR_WRITER,
  USER_ACCESS_CALCULATOR_READER,
  USER_ACCESS_AVERAGE_TIME_WRITER,
  USER_ACCESS_AVERAGE_TIME_READER,
} = require('../../../constants/access')

module.exports = {
  up: async (queryInterface, Sequelize, models) => {
    const usersAccess = await models.UsersAccess.findAll({
      attributes: ['id', 'user_id', 'access_id'],
      where: {},
    })

    for (let i = 0; i < usersAccess.length; i++) {
      const access = usersAccess[i]

      switch (access.dataValues.access_id) {
        case 1:
          await access.update({ access_id: USER_ACCESS_DASHBOARD_READER })
          await models.UsersAccess.create({ user_id: access.dataValues.user_id, access_id: USER_ACCESS_DASHBOARD_WRITER })
          break
        case 2:
          await access.update({ access_id: USER_ACCESS_VENTILATIONS_READER })
          await models.UsersAccess.create({ user_id: access.dataValues.user_id, access_id: USER_ACCESS_VENTILATIONS_WRITER })
          break
        case 3:
          await access.update({ access_id: USER_ACCESS_ACTIVITIES_READER })
          await models.UsersAccess.create({ user_id: access.dataValues.user_id, access_id: USER_ACCESS_ACTIVITIES_WRITER })
          break
        case 4:
          await access.update({ access_id: USER_ACCESS_AVERAGE_TIME_READER })
          await models.UsersAccess.create({ user_id: access.dataValues.user_id, access_id: USER_ACCESS_AVERAGE_TIME_WRITER })
          break
        case 5:
          await access.update({ access_id: USER_ACCESS_CALCULATOR_READER })
          await models.UsersAccess.create({ user_id: access.dataValues.user_id, access_id: USER_ACCESS_CALCULATOR_WRITER })
          break
        case 6:
          await access.update({ access_id: USER_ACCESS_SIMULATOR_READER })
          await models.UsersAccess.create({ user_id: access.dataValues.user_id, access_id: USER_ACCESS_SIMULATOR_WRITER })
          break
        case 61:
          await access.update({ access_id: USER_ACCESS_WHITE_SIMULATOR_READER })
          await models.UsersAccess.create({ user_id: access.dataValues.user_id, access_id: USER_ACCESS_WHITE_SIMULATOR_WRITER })
          break
        case 7:
          await access.update({ access_id: USER_ACCESS_WHITE_SIMULATOR_READER })
          await models.UsersAccess.create({ user_id: access.dataValues.user_id, access_id: USER_ACCESS_WHITE_SIMULATOR_WRITER })
          break
      }
    }
  },
  down: (/*queryInterface , Sequelize*/) => {},
}
