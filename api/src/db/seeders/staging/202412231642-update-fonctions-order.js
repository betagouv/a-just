const { isCa } = require("../../../utils/ca");

module.exports = {
  up: async (queryInterface, Sequelize, models) => {
    if (isCa()) {
      const fctGreffe = [
        'DG',
        'DG-A',
        'A',
        'CHCAB',
        'A GREFFIER',
        'B',
        'CM',
        'CS',
        'SA',
        'CB',
        'CT',
        'A PLACÉ',
        'B GREF  PLACÉ',
        'B PLACÉ',
        'CB PLACÉ',
        'CT PLACÉ',
        'GRES',
        'CONT A',
        'CONT B',
        'CONT C',
        'CONT CB',
        'CONT CT',
        'VAC',
        'CONT A JP',
        'CONT B JP',
        'CONT C JP'
      ]

      fctGreffe.map(async (x,index)=>{
        const findFunction = await models.HRFonctions.findOne({
          where: {
            code: x,
            category_id: 2
          },
        });

        if(findFunction)
          await findFunction.update({
            rank: index,
          });
      })

      const fctCont = [
        'AS',
        'ADJ',
        'Att. J',
        'JA',
        'PPI',
        'CONT A JP',
        'CONT B JP',
        'CONT C JP'
      ]

      fctCont.map(async (x,index)=>{
        const findFunction = await models.HRFonctions.findOne({
          where: {
            code: x,
            category_id: 3
          },
        });

        if(findFunction)
          await findFunction.update({
            rank: index,
          });
      })


    }
  },
  down: (/*queryInterface , Sequelize*/) => {},
};
