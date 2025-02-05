const { isTj } = require("../../../utils/ca");

module.exports = {
  up: async (queryInterface, Sequelize, models) => {
    if (isTj()) {
      const fctToClean = ["RESERVISTES GREF","VACATAIRES","HONORAIRES","MTT","RESERVISTES","JURISTE AS","ASSIST_JUST"]
      
      await fctToClean.map(async(f)=>{
        const findAllFct = await models.HRFonctions.findAll({
          where: {
            recoded_function: f,
          },
        });
        if (findAllFct) {
          for (let i = 0; i < findAllFct.length; i++) {
            await findAllFct[i].update({
              recoded_function: "",
            });
          }
        }      
      })
    
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

      const findContBJP = await models.HRFonctions.findAll({
        where: {
          code: "CONT B JP"
        },
      });
      if (findContBJP) {
        for (let i = 0; i < findContBJP.length; i++) {
          await findContBJP[i].update({
            recoded_function: "Fonctionnaire A-B-CBUR",
          });
        }
      }

      const findContCJP = await models.HRFonctions.findAll({
        where: {
          code: "CONT C JP"
        },
      });
      if (findContCJP) {
        for (let i = 0; i < findContCJP.length; i++) {
          await findContCJP[i].update({
            recoded_function: "Fonctionnaire A-B-CBUR",
          });
        }
      }
      
    
    }
  },
  down: (/*queryInterface , Sequelize*/) => {},
};
