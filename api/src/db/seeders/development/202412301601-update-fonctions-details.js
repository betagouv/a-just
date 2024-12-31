const { isCa } = require("../../../utils/ca");

module.exports = {
  up: async (queryInterface, Sequelize, models) => {
    if (isCa()) {
      const detailsFct = [
        {
          code: "PP",
          detail: "M-TIT",
        },
        {
          code: "CSG",
          detail: "M-TIT",
        },
        {
          code: "1PC",
          detail: "M-TIT",
        },
        {
          code: "C",
          detail: "M-TIT",
        },
        {
          code: "A",
          detail: "F-TIT",
        },
        {
          code: "A GREFFIER",
          detail: "F-TIT",
        },
        {
          code: "B",
          detail: "F-TIT",
        },
        {
          code: "CT",
          detail: "F-TIT",
        },
        {
          code: "A PLACÉ",
          detail: "F-PLAC-ADD",
        },
        {
          code: "CB PLACÉ",
          detail: "F-PLAC-ADD",
        },
        {
          code: "GRES",
          detail: "C",
        },
        {
          code: "CONT A",
          detail: "C",
        },
        {
          code: "CONT C",
          detail: "C",
        },
        {
          code: "CONT CB",
          detail: "C",
        },
        {
          code: "CONT CT",
          detail: "C",
        },
        {
          code: "ADJ",
          detail: "C",
        },
        {
          code: "Att. J",
          detail: "C",
        },
        {
          code: "PPI",
          detail: "C",
        },
        {
          code: "JA",
          detail: "C",
        },
        {
          code: "CONT A JP",
          detail: "C",
          category: 3,
        },
        {
          code: "AS",
          detail: "C",
        },
        {
          code: "B GREF PLACÉ",
          detail: "F-PLAC-ADD",
        },
        {
          code: "MHFJ",
          detail: "M-CONT",
        },
        {
          code: "CONT B",
          detail: "C",
        },
        {
          code: "PCINS",
          detail: "M-TIT",
        },
        {
          code: "CHCAB",
          detail: "F-TIT",
        },
        {
          code: "CB",
          detail: "F-TIT",
        },
        {
          code: "B PLACÉ",
          detail: "F-PLAC-ADD",
        },
        {
          code: "VAC",
          detail: "C",
        },
        {
          code: "CONT B JP",
          detail: "C",
          category: 2,
        },
        {
          code: "CONT A JP",
          detail: "C",
          category: 2,
        },
        {
          code: "CONT C JP",
          detail: "C",
          category: 2,
        },
        {
          code: "JP",
          detail: "M-PLAC-ADD",
        },
        {
          code: "MHFNJ",
          detail: "M-CONT",
        },
        {
          code: "MTT",
          detail: "M-CONT",
        },
        {
          code: "MRES",
          detail: "M-CONT",
        },
        {
          code: "PC",
          detail: "M-TIT",
        },
        {
          code: "SA",
          detail: "F-TIT",
        },
        {
          code: "CT PLACÉ",
          detail: "F-PLAC-ADD",
        },
        {
          code: "VPP",
          detail: "M-PLAC-ADD",
        },
        {
          code: "CONT C JP",
          detail: "C",
          category: 3,
        },
        {
          code: "CONT B JP",
          detail: "C",
          category: 3,
        },
      ];

      detailsFct.map(async (x) => {
        let findFunction = null;
        if (x.category)
          findFunction = await models.HRFonctions.findOne({
            where: {
              code: x.code,
              category_id: x.category,
            },
          });
        else
          findFunction = await models.HRFonctions.findOne({
            where: {
              code: x.code,
            },
          });

        if (findFunction)
          await findFunction.update({
            category_detail: x.detail,
          });
      });
    }
  },
  down: (/*queryInterface , Sequelize*/) => {},
};
