const { isCa } = require("../../../utils/ca");

module.exports = {
  up: async (queryInterface, Sequelize, models) => {
    if (isCa() === true) {
      const functionsList = [
        {
          code: "PP",
          category_detail: "M-TIT",
          recoded_function: "Magistrat SIEGE",
        },
        {
          code: "1PC",
          category_detail: "M-TIT",
          recoded_function: "Magistrat SIEGE",
        },
        {
          code: "PC",
          category_detail: "M-TIT",
          recoded_function: "Magistrat SIEGE",
        },
        {
          code: "PCINS",
          category_detail: "M-TIT",
          recoded_function: "Magistrat SIEGE",
        },
        {
          code: "CSG",
          category_detail: "M-TIT",
          recoded_function: "Magistrat SIEGE",
        },
        {
          code: "C",
          category_detail: "M-TIT",
          recoded_function: "Magistrat SIEGE",
        },
        {
          code: "VPP",
          category_detail: "M-PLAC-ADD",
          recoded_function: "Magistrat placé ADD",
        },
        {
          code: "JP",
          category_detail: "M-PLAC-ADD",
          recoded_function: "Magistrat placé ADD",
        },
        {
          code: "MHFJ",
          category_detail: "M-CONT",
          recoded_function: "",
        },
        {
          code: "MHFNJ",
          category_detail: "M-CONT",
          recoded_function: "",
        },
        {
          code: "MRES",
          category_detail: "M-CONT",
          recoded_function: "",
        },
        {
          code: "MTT",
          category_detail: "M-CONT",
          recoded_function: "",
        },
        {
          code: "DG",
          category_detail: "F-TIT",
          recoded_function: "Fonctionnaire A-B-CBUR",
        },
        {
          code: "CHCAB",
          category_detail: "F-TIT",
          recoded_function: "Fonctionnaire A-B-CBUR",
        },
        {
          code: "DG-A",
          category_detail: "F-TIT",
          recoded_function: "Fonctionnaire A-B-CBUR",
        },
        {
          code: "CM",
          category_detail: "F-TIT",
          recoded_function: "Fonctionnaire A-B-CBUR",
        },
        {
          code: "CS",
          category_detail: "F-TIT",
          recoded_function: "Fonctionnaire A-B-CBUR",
        },
        {
          code: "A GREFFIER",
          category_detail: "F-TIT",
          recoded_function: "Fonctionnaire A-B-CBUR",
        },
        {
          code: "A",
          category_detail: "F-TIT",
          recoded_function: "Fonctionnaire A-B-CBUR",
        },
        {
          code: "B",
          category_detail: "F-TIT",
          recoded_function: "Fonctionnaire A-B-CBUR",
        },
        {
          code: "SA",
          category_detail: "F-TIT",
          recoded_function: "Fonctionnaire A-B-CBUR",
        },
        {
          code: "CB",
          category_detail: "F-TIT",
          recoded_function: "Fonctionnaire A-B-CBUR",
        },
        {
          code: "CT",
          category_detail: "F-TIT",
          recoded_function: "Fonctionnaire CTECH",
        },
        {
          code: "A PLACÉ",
          category_detail: "F-PLAC-ADD",
          recoded_function: "Fonctionnaire A-B-CBUR placé ADD",
        },
        {
          code: "A PLACÉ ADDITIONNEL",
          category_detail: "F-PLAC-ADD",
          recoded_function: "Fonctionnaire A-B-CBUR placé ADD",
        },
        {
          code: "A PLACÉ SUBSTITUTION",
          category_detail: "F-PLAC-SUB",
          recoded_function: "Fonctionnaire A-B-CBUR placé SUB",
        },
        {
          code: "B GREF PLACÉ",
          category_detail: "F-PLAC-ADD",
          recoded_function: "Fonctionnaire A-B-CBUR placé ADD",
        },
        {
          code: "B GREF PLACÉ ADDITIONNEL",
          category_detail: "F-PLAC-ADD",
          recoded_function: "Fonctionnaire A-B-CBUR placé ADD",
        },
        {
          code: "B GREF PLACÉ SUBSTITUTION",
          category_detail: "F-PLAC-SUB",
          recoded_function: "Fonctionnaire A-B-CBUR placé SUB",
        },
        {
          code: "B PLACÉ",
          category_detail: "F-PLAC-ADD",
          recoded_function: "Fonctionnaire A-B-CBUR placé ADD",
        },
        {
          code: "B PLACÉ ADDITIONNEL",
          category_detail: "F-PLAC-ADD",
          recoded_function: "Fonctionnaire A-B-CBUR placé ADD",
        },
        {
          code: "B PLACÉ SUBSTITUTION",
          category_detail: "F-PLAC-SUB",
          recoded_function: "Fonctionnaire A-B-CBUR placé SUB",
        },
        {
          code: "CB PLACÉ",
          category_detail: "F-PLAC-ADD",
          recoded_function: "Fonctionnaire A-B-CBUR placé ADD",
        },
        {
          code: "CB PLACÉ ADDITIONNEL",
          category_detail: "F-PLAC-ADD",
          recoded_function: "Fonctionnaire A-B-CBUR placé ADD",
        },
        {
          code: "CB PLACÉ SUBSTITUTION",
          category_detail: "F-PLAC-SUB",
          recoded_function: "Fonctionnaire A-B-CBUR placé SUB",
        },
        {
          code: "CT PLACÉ",
          category_detail: "F-PLAC-ADD",
          recoded_function: "Fonctionnaire CTECH placé ADD",
        },
        {
          code: "CT PLACÉ ADDITIONNEL",
          category_detail: "F-PLAC-ADD",
          recoded_function: "Fonctionnaire CTECH placé ADD",
        },
        {
          code: "CT PLACÉ SUBSTITUTION",
          category_detail: "F-PLAC-SUB",
          recoded_function: "Fonctionnaire CTECH placé SUB",
        },
        {
          code: "GRES",
          category_detail: "C",
          recoded_function: "",
        },
        {
          code: "CONT A",
          category_detail: "C",
          recoded_function: "",
        },
        {
          code: "CONT A JP",
          category_detail: "C",
          recoded_function: "",
        },
        {
          code: "CONT B",
          category_detail: "C",
          recoded_function: "",
        },
        {
          code: "CONT B JP",
          category_detail: "C",
          recoded_function: "",
        },
        {
          code: "CONT C",
          category_detail: "C",
          recoded_function: "",
        },
        {
          code: "CONT C JP",
          category_detail: "C",
          recoded_function: "",
        },
        {
          code: "CONT CB",
          category_detail: "C",
          recoded_function: "",
        },
        {
          code: "CONT CT",
          category_detail: "C",
          recoded_function: "",
        },
        {
          code: "VAC",
          category_detail: "C",
          recoded_function: "",
        },
        {
          code: "Att. J",
          category_detail: "C",
          recoded_function: "Att J",
        },
        {
          code: "AS",
          category_detail: "C",
          recoded_function: "",
        },
        {
          code: "JA Chambres Sociales",
          category_detail: "C",
          recoded_function: "JURISTE AS chambres sociales",
        },
        {
          code: "JA Siège Autres",
          category_detail: "C",
          recoded_function: "JURISTE AS siège Autres",
        },
        {
          code: "JA Parquet Général",
          category_detail: "C",
          recoded_function: "JURISTE AS parquet général",
        },
        {
          code: "JA",
          category_detail: "C",
          recoded_function: "JURISTE AS siège Autres",
        },
        {
          code: "JA Siège autres",
          category_detail: "C",
          recoded_function: "JURISTE AS siège Autres",
        },
        {
          code: "ADJ",
          category_detail: "C",
          recoded_function: "",
        },
        {
          code: "CONT A JP",
          category_detail: "C",
          recoded_function: "",
        },
        {
          code: "CONT B JP",
          category_detail: "C",
          recoded_function: "",
        },
        {
          code: "CONT C JP",
          category_detail: "C",
          recoded_function: "",
        },
        {
          code: "PPI",
          category_detail: "C",
          recoded_function: "",
        },
      ];

      for (let k = 0; k < functionsList.length; k++) {
        let findFct = null;

        findFct = await models.HRFonctions.findOne({
          where: {
            code: functionsList[k].code,
          },
        });

        if (findFct)
          await findFct.update({
            recoded_function: functionsList[k]["recoded_function"],
            category_detail: functionsList[k]["category_detail"],
          });
      }
    }
  },
  down: (/*queryInterface , Sequelize*/) => {},
};
