import { isCa } from "../../../utils/ca";

module.exports = {
  up: async (queryInterface, Sequelize, models) => {
    if (isCa()) {
      await models.HRBackupsGroups.create({
        label: "Groupe CA - droit local",
      });
    } else {
      await models.HRBackupsGroups.create({
        label: "Groupe TJ - droit local",
      });
    }
  },
  down: (/*queryInterface , Sequelize*/) => {},
};
