import { accessList } from '../../../constants/access'

module.exports = {
  up: async (queryInterface, Sequelize, models) => {

    const user = await models.Users.findOne({
        where: {
            email: "utilisateurtest@a-just.fr"
        },
    })

    const hrBackups = await models.HRBackups.findAll()

    if (!hrBackups && !user) 
        return
    
    for (let i = 0; i < accessList.length; i++) {
      await models.UsersAccess.create({
        user_id: user.dataValues.id,
        access_id: accessList[i].id,
      })
    }


  },
  down: (/*queryInterface , Sequelize*/) => {},
}