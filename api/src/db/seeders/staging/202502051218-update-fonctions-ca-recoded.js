const { isCa } = require("../../../utils/ca");

module.exports = {
  up: async (queryInterface, Sequelize, models) => {
    if (isCa()) {
      // CLEAN RECODED FCT
      const fctToClean = [
        "VPP",
        "JP",
        "A PLACÉ",
        "B GREF PLACÉ",
        "B PLACÉ",
        "CB PLACÉ",
        "CT PLACÉ",
        "Att. J",
        "JA",
      ];

      await fctToClean.map(async (f) => {
        const findAllFct = await models.HRFonctions.findAll({
          where: {
            code: f,
          },
        });
        if (findAllFct) {
          for (let i = 0; i < findAllFct.length; i++) {
            await findAllFct[i].update({
              recoded_function: "",
            });
          }
        }
      });

      // ADD CONT B ET C
      const fctCONTBC = ["CONT B JP","CONT C JP","CONT B","CONT C","CONT CB"]
      await fctCONTBC.map(async (f) => {
        const findAllFct = await models.HRFonctions.findAll({
          where: {
            code: f,
          },
        });
        if (findAllFct) {
          for (let i = 0; i < findAllFct.length; i++) {
            await findAllFct[i].update({
              recoded_function: "Fonctionnaire A-B-CBUR",
            });
          }
        }
      });

      // ADD CONT B ET C
      const fctCONTCT = ["CONT CT"]
      await fctCONTCT.map(async (f) => {
        const findAllFct = await models.HRFonctions.findAll({
          where: {
            code: f,
          },
        });
        if (findAllFct) {
          for (let i = 0; i < findAllFct.length; i++) {
            await findAllFct[i].update({
              recoded_function: "Fonctionnaire CTECH",
            });
          }
        }
      });

    }
  },
  down: (/*queryInterface , Sequelize*/) => {},
};
