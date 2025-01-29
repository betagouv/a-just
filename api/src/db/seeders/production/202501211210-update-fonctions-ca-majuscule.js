const { isCa } = require("../../../utils/ca");

module.exports = {
  up: async (queryInterface, Sequelize, models) => {
    if (isCa()) {
      const findAllFct = await models.HRFonctions.findAll({})
      for (let i = 0; i < findAllFct.length; i++) {
        await findAllFct[i].update({
          label: findAllFct[i].label.toUpperCase(),
        })
      }
    }
  },
  down: (/*queryInterface , Sequelize*/) => {},
};
