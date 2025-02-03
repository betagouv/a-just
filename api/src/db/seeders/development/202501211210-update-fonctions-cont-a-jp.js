const { isTj } = require("../../../utils/ca");

module.exports = {
  up: async (queryInterface, Sequelize, models) => {
    if (isTj()) {
      const findAllFct = await models.HRFonctions.findAll({
        where: {
          code: "CONT A JP",
        },
      });
      for (let i = 0; i < findAllFct.length; i++) {
        await findAllFct[i].update({
          recoded_function: "",
        });
      }
    }
  },
  down: (/*queryInterface , Sequelize*/) => {},
};
