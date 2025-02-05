const { isTj } = require("../../../utils/ca");

module.exports = {
  up: async (queryInterface, Sequelize, models) => {
    if (isTj()) {
      const findAllFctJA = await models.HRFonctions.findAll({
        where: {
          recoded_function: "JURISTE AS",
        },
      });
      if (findAllFctJA) {
        for (let i = 0; i < findAllFctJA.length; i++) {
          await findAllFctJA[i].update({
            recoded_function: "",
          });
        }
      }
      const findAllFct = await models.HRFonctions.findAll({
        where: {
          recoded_function: "ASSIST_JUST",
        },
      });
      if (findAllFct) {
        for (let i = 0; i < findAllFct.length; i++) {
          await findAllFct[i].update({
            recoded_function: "",
          });
        }
      }
    
      const findAllContA = await models.HRFonctions.findAll({
        where: {
          recoded_function: "Fonctionnaire A-B-CBUR",
          code: "CONT A"
        },
      });
      if (findAllContA) {
        for (let i = 0; i < findAllContA.length; i++) {
          await findAllContA[i].update({
            recoded_function: "",
          });
        }
      }
    
    }
  },
  down: (/*queryInterface , Sequelize*/) => {},
};
