import { juridictionJIRS } from "../../../constants/juridiction-jirs"

module.exports = {
    up: async (queryInterface, Sequelize, models) => {
      const tj = await models.HRBackups.findAll()
  
      for(let i = 0; i < tj.length; i++) {
        if (juridictionJIRS.includes(tj[i].dataValues.label)) {
          await tj[i].update({
            jirs: true,
          })
        } else {
          await tj[i].update({
            jirs: false,
          })
        }
      }
    },
    down: (/*queryInterface , Sequelize*/) => { },
  }