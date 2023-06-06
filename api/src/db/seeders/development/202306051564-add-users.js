import { crypt } from '../../../utils'

module.exports = {
  up: async (queryInterface, Sequelize, models) => {
    const data = {
      first_name: 'Redwane',
      last_name: 'Zafari',
      password: crypt.encryptPassword('123456'),
      status: 1,
      role: 2,
    }
    const user = await models.Users.findOne({
      where: { email: 'redwane.zafari@a-just.fr' },
    })
    if (user) {
      await user.update(data)
    } else {
      await models.Users.create(
        {
          email: 'redwane.zafari@a-just.fr',
          ...data,
        },
        true
      )
    }
  },
  down: (/*queryInterface , Sequelize*/) => {},
}
