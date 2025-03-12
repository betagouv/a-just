import { Op } from "sequelize";

module.exports = {
  up: async (queryInterface, Sequelize, models) => {
    const findJuridiction = await models.HRBackups.findOne({
      where: {
        label: "CA DE DEMO",
      },
      raw: true,
    });
    console.log(findJuridiction)
    if (findJuridiction) {
      const hr = await models.HumanResources.findAll({
        where: {
          backup_id: findJuridiction.id,
        },
      });

      for (let i = 0; i < hr.length; i++) {
        await hr[i].update({
          juridiction: "CA DE DEMO",
        });
      }
    }
  },
  down: (/*queryInterface , Sequelize*/) => {},
};
