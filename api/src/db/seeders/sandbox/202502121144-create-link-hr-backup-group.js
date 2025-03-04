import { Op } from "sequelize";
import { isCa } from "../../../utils/ca";

module.exports = {
  up: async (queryInterface, Sequelize, models) => {
    let HRBacupGroupLales = []
    if (isCa()) {
      HRBacupGroupLales = ['COLMAR', 'METZ']
    } else {
      HRBacupGroupLales = ['STRASBOURG', 'MULHOUSE', 'SAVERNE', 'COLMAR', 'METZ', 'SARREGUEMINES', 'THIONVILLE']
    }

    for(let i = 0; i < HRBacupGroupLales.length; i++) {
      const key = HRBacupGroupLales[i]
      const findJuridiction = await models.HRBackups.findOne({
        where: {
          label: {
            [Op.like]: `%${key}%`
          }
        },
        raw: true
      })
      if(findJuridiction) {
        await models.HRBackupsGroupsIds.create({
          hr_backup_group_id: 1,
          hr_backup_id: findJuridiction.id
        })
      }
    } 
  },
  down: (/*queryInterface , Sequelize*/) => {},
};
