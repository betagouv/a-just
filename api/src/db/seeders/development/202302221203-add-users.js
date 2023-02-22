import { crypt } from '../../../utils'

module.exports = {
  up: async (queryInterface, Sequelize, models) => {
    await models.Users.create(
      {
        email: 'redwane.zafari@a-just.fr',
        first_name: 'Redwane',
        last_name: 'Zafari',
        password: crypt.encryptPassword('123456'),
        status: 1,
        role: 1,
      },
      true
    )
  },
  down: (/*queryInterface , Sequelize*/) => {},
}
