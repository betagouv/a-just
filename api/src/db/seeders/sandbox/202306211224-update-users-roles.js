import { Op } from 'sequelize'
import { USER_ROLE_TEAM } from '../../../constants/roles'

module.exports = {
  up: async (queryInterface, Sequelize, models) => {
    const users = await models.Users.findAll({
      where: {
        email: {
          [Op.like]: '%@a-just.fr',
        },
        role: null,
      },
    })


    for(let i = 0; i < users.length; i++) {
      await users[i].update({
        role: USER_ROLE_TEAM,
      })
    }
  },
  down: (/*queryInterface , Sequelize*/) => { },
}
