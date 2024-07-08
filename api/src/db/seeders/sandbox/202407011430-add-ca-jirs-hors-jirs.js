import { juridictionJIRS } from "../../../constants/juridiction-jirs"
import { isCa } from "../../../utils/ca"

module.exports = {
  up: async (queryInterface, Sequelize, models) => {
    if (isCa()) {
      const tableCA = await models.TJ.findAll()
      for (let i = 0; i < tableCA.length; i++) {
        await models.HRBackups.findOrCreateLabel(tableCA[i].label)
      }

      const tj = await models.HRBackups.findAll()
      for (let i = 0; i < tj.length; i++) {
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
    }
  },
  down: (/*queryInterface , Sequelize*/) => { },
}