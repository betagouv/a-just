const { isCa } = require("../../../utils/ca");

module.exports = {
  up: async (queryInterface, Sequelize, models) => {
    if (isCa()) {
      const findFunction = await models.HRFonctions.findOne({
        where: {
          label: "ATTACHÉ DE JUSTICE",
        },
      });
      if (findFunction) {
        await findFunction.update({
          label: "Attaché de justice",
        });
      }
    }
  },
  down: (/*queryInterface , Sequelize*/) => {},
};
