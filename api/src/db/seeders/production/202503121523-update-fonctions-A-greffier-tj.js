const { isTj } = require("../../../utils/ca");

module.exports = {
  up: async (queryInterface, Sequelize, models) => {
    if (isTj()) {
      const findAllFct = await models.HRFonctions.findAll({
        where: {
          code: "A GREFFIER",
        },
      });
      for (let i = 0; i < findAllFct.length; i++) {
        await findAllFct[i].update({
          category_detail: "F-TIT"
        });
      }
    }
  },
  down: (/*queryInterface , Sequelize*/) => {},
};
