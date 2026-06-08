const { USER_ACCESS_DASHBOARD_READER, USER_ACCESS_DASHBOARD_WRITER } = require('../../constants/access')

module.exports = {
  up: async (queryInterface, Sequelize, models) => {
    const readers = await models.UsersAccess.findAll({
      attributes: ['user_id'],
      where: { access_id: USER_ACCESS_DASHBOARD_READER },
    })

    const userIds = [...new Set(readers.map((reader) => reader.user_id))]

    if (userIds.length === 0) {
      return
    }

    const existingWriters = await models.UsersAccess.findAll({
      attributes: ['user_id'],
      where: {
        access_id: USER_ACCESS_DASHBOARD_WRITER,
        user_id: userIds,
      },
    })

    const existingWriterUserIds = new Set(existingWriters.map((writer) => writer.user_id))

    const accessToCreate = userIds
      .filter((userId) => !existingWriterUserIds.has(userId))
      .map((userId) => ({
        user_id: userId,
        access_id: USER_ACCESS_DASHBOARD_WRITER,
      }))

    if (accessToCreate.length > 0) {
      await models.UsersAccess.bulkCreate(accessToCreate)
    }
  },
  down: (/*queryInterface , Sequelize*/) => {},
}
