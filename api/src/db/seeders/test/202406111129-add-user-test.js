import { crypt } from '../../../utils'

module.exports = {
    up: async (queryInterface, Sequelize, models) => {
      await models.Users.create(
        {
          email: 'utilisateurtest@a-just.fr',
          first_name: 'utilisateur',
          last_name: 'test',
          password: crypt.encryptPassword('3Bv6%BzX'),
          status: 1,
          role: 2,
        },
        true
      )
  
      // const user = await models.Users.findOne({
      //     where: {
      //     email: 'utilisateurtest@a-just.fr',
      //     },
      // })
      // await models.Users.updatePassword(user.dataValues.id, '3Bv6%BzX')
    },
    down: (/*queryInterface , Sequelize*/) => {},
  }
  