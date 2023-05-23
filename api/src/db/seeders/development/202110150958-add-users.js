import { crypt } from '../../../utils'

module.exports = {
  up: async (queryInterface, Sequelize, models) => {
    await models.Users.create(
      {
        email: 'fx@a-just.fr',
        first_name: 'François-Xavier',
        last_name: 'Montigny',
        password: crypt.encryptPassword('123456'),
        status: 1,
        role: 1,
      },
      true
    )
  },
  down: (/*queryInterface , Sequelize*/) => {},
}
