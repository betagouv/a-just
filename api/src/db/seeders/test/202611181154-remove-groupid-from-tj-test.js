import { JURIDICTION_TEST_NAME } from '../../../../test/constants/juridiction'

module.exports = {
  up: async (queryInterface, Sequelize, models) => {
    await models.HRBackups.update(
      { group_id: null },
      {
        where: {
          label: JURIDICTION_TEST_NAME,
        },
      }
    )
  },
  down: (/*queryInterface, Sequelize*/) => { },
}
