const { isCa } = require("../../../utils/ca");

module.exports = {
  up: async (queryInterface, Sequelize, models) => {
    if (isCa() === false) {
      const functionsList = [
        {
          code: "P",
          recoded_function: "Magistrat SIEGE NS",
        },
        {
          code: "1VP",
          recoded_function: "Magistrat SIEGE NS",
        },
        {
          code: "1VPA",
          recoded_function: "Magistrat SIEGE NS",
        },
        {
          code: "1VPCP",
          recoded_function: "Magistrat SIEGE S",
        },
        {
          code: "1VPE",
          recoded_function: "Magistrat SIEGE S",
        },
        {
          code: "1VPI",
          recoded_function: "Magistrat SIEGE S",
        },
        {
          code: "VPSG",
          recoded_function: "Magistrat SIEGE NS",
        },
        {
          code: "1VPAP",
          recoded_function: "Magistrat SIEGE S",
        },
        {
          code: "1VPLD",
          recoded_function: "Magistrat SIEGE S",
        },
        {
          code: "VP",
          recoded_function: "Magistrat SIEGE NS",
        },
        {
          code: "VPCP",
          recoded_function: "Magistrat SIEGE S",
        },
        {
          code: "VPE",
          recoded_function: "Magistrat SIEGE S",
        },
        {
          code: "VPI",
          recoded_function: "Magistrat SIEGE S",
        },
        {
          code: "VPAP",
          recoded_function: "Magistrat SIEGE S",
        },
        {
          code: "VPLD",
          recoded_function: "Magistrat SIEGE S",
        },
        {
          code: "J",
          recoded_function: "Magistrat SIEGE NS",
        },
        {
          code: "JCP",
          recoded_function: "Magistrat SIEGE S",
        },
        {
          code: "JE",
          recoded_function: "Magistrat SIEGE S",
        },
        {
          code: "JI",
          recoded_function: "Magistrat SIEGE S",
        },
        {
          code: "JAP",
          recoded_function: "Magistrat SIEGE S",
        },
        {
          code: "MHFJ",
          recoded_function: "HONORAIRES",
        },
        {
          code: "MHFNJ",
          recoded_function: "HONORAIRES",
        },
        {
          code: "MTT",
          recoded_function: "MTT",
        },
        {
          code: "MRES",
          recoded_function: "RESERVISTES",
        },
        {
          code: "A",
          recoded_function: "Fonctionnaire A-B-CBUR",
        },
        {
          code: "A GREFFIER",
          recoded_function: "Fonctionnaire A-B-CBUR",
        },
        {
          code: "CHCAB",
          recoded_function: "Fonctionnaire A-B-CBUR",
        },
        {
          code: "B",
          recoded_function: "Fonctionnaire A-B-CBUR",
        },
        {
          code: "SA",
          recoded_function: "Fonctionnaire A-B-CBUR",
        },
        {
          code: "CB",
          recoded_function: "Fonctionnaire A-B-CBUR",
        },
        {
          code: "CT",
          recoded_function: "Fonctionnaire CTECH",
        },
        {
          code: "GRES",
          recoded_function: "RESERVISTES GREF",
        },
        {
          code: "CONT A",
          recoded_function: "Fonctionnaire A-B-CBUR",
        },
        {
          code: "CONT B",
          recoded_function: "Fonctionnaire A-B-CBUR",
        },
        {
          code: "CONT C",
          recoded_function: "Fonctionnaire A-B-CBUR",
        },
        {
          code: "CONT CB",
          recoded_function: "Fonctionnaire A-B-CBUR",
        },
        {
          code: "CONT CT",
          recoded_function: "Fonctionnaire CTECH",
        },
        {
          code: "VAC",
          recoded_function: "VACATAIRES",
        },
        {
          code: "CONT A JP",
          recoded_function: "CONT A JP Greffe",
          category: "Greffe",
        },
        {
          code: "CONT B JP",
          recoded_function: "Fonctionnaire A-B-CBUR",
          category: "Greffe",
        },
        {
          code: "CONT C JP",
          recoded_function: "Fonctionnaire A-B-CBUR",
          category: "Greffe",
        },
        {
          code: "AS",
          recoded_function: "",
        },
        {
          code: "ADJ",
          recoded_function: "ASSIST_JUST",
        },
        {
          code: "Att. J",
          recoded_function: "JURISTE AS",
        },
        {
          code: "PPI",
          recoded_function: "",
        },
      ];

      for (let k = 0; k < functionsList.length; k++) {
        let findCat = null;
        let findFct = null;

        if (functionsList[k].category) {
          findCat = await models.HRCategories.findOne({
            where: {
              label: functionsList[k].category,
            },
          });
          findFct = await models.HRFonctions.findOne({
            where: {
              code: functionsList[k].code,
              category_id:findCat.id
            },
          });

          if (findFct)
            await findFct.update({
              recoded_function: functionsList[k]["recoded_function"],
            });
        }

        if (!functionsList[k].category) {
          findFct = await models.HRFonctions.findOne({
            where: {
              code: functionsList[k].code,
            },
          });

          if (findFct)
            await findFct.update({
              recoded_function: functionsList[k]["recoded_function"],
            });
        }
      }
    }
  },
  down: (/*queryInterface , Sequelize*/) => {},
};
