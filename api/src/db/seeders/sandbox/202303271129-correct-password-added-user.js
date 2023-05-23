import { crypt } from '../../../utils/index'

module.exports = {
  up: async (queryInterface, Sequelize, models) => {
    models.Users.update(
      {
        password: crypt.encryptPassword('123456'),
      },
      {
        where: {
          email: 'fx@a-just.fr',
        },
      }
    )
  },
  down: (/*queryInterface , Sequelize*/) => {},
}
