import { crypt } from '../../../utils'

module.exports = {
  up: async (queryInterface, Sequelize, models) => {
    await models.Users.create(
      {
        email: 'fx@a-just.fr',
        first_name: 'François-Xavier',
        last_name: 'Montigny',
        password: '123456',
        status: 1,
        role: 1,
      },
      true
    )

    await models.Users.create(
      {
        email: 'redwane.zafari@a-just.fr',
        first_name: 'Redwane',
        last_name: 'Zafari',
        password: '123456',
        status: 1,
        role: 2,
      },
      true
    )

    const users = await models.Users.findAll({
      where: {
        email: ['redwane.zafari@a-just.fr', 'fx@a-just.fr'],
      },
    })

    for (let i = 0; i < users.length; i++) {
      const newPassword = crypt.encryptPassword('123456')
      users[i].update({ password : newPassword })
    }

    const [e2eUser, createdE2e] = await models.Users.findOrCreate({
      where: { email: 'utilisateurtest@a-just.fr' },
      defaults: {
        email: 'utilisateurtest@a-just.fr',
        first_name: 'Utilisateur',
        last_name: 'Test',
        password: crypt.encryptPassword('@bUgGD25gX1b'),
        status: 1,
        role: 2,
      },
    })
    if (!createdE2e) {
      await e2eUser.update({ password: crypt.encryptPassword('@bUgGD25gX1b'), status: 1, role: 2 })
    }
  },
  down: (/*queryInterface , Sequelize*/) => {},
}
