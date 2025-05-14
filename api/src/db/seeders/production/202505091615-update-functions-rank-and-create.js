const { isCa, isTj } = require("../../../utils/ca");

module.exports = {
  up: async (queryInterface, Sequelize, models) => {
    if (isCa()) {
      const newFunctions = [
        {
          Label: "CHEF DE CABINET",
          Code: "CHCAB",
          Rank: "1",
          "Category ID": "3",
          "Category Detail": "C",
          "Calculatrice Is Active": "VRAI",
          Position: "Contractuel",
          "Recoded Function": "Fonctionnaire A-B-CBUR",
        },
        {
          Label: "CHARGE DE MISSION",
          Code: "CMISSION",
          Rank: "2",
          "Category ID": "3",
          "Category Detail": "C",
          "Calculatrice Is Active": "VRAI",
          Position: "Contractuel",
          "Recoded Function": "Fonctionnaire A-B-CBUR",
        },
        {
          Label: "DG",
          Code: "DG",
          Rank: "1",
          "Category ID": "2",
          "Category Detail": "F-TIT",
          "Calculatrice Is Active": "FAUX",
          Position: "Titulaire",
          "Recoded Function": "Fonctionnaire A-B-CBUR",
        },
        {
          Label: "DSGJ",
          Code: "DSGJ",
          Rank: "2",
          "Category ID": "2",
          "Category Detail": "F-TIT",
          "Calculatrice Is Active": "FAUX",
          Position: "Titulaire",
          "Recoded Function": "Fonctionnaire A-B-CBUR",
        },
        {
          Label: "DSGJ PLACÉ",
          Code: "DSGJ PLACÉ",
          Rank: "10",
          "Category ID": "2",
          "Category Detail": "F-PLAC-ADD",
          "Calculatrice Is Active": "FAUX",
          Position: "Placé",
          "Recoded Function": "",
        },
      ];

      newFunctions.map(async (fct, index) => {
        let findFunction = null;
        findFunction = await models.HRFonctions.findOne({
          where: {
            code: fct.Code,
          },
        });

        if (!findFunction) {
          await models.HRFonctions.create({
            recoded_function: fct["Recoded Function"],
            position: fct.Position,
            code: fct.Code,
            label: fct.Label,
            category_id: fct["Category ID"],
            rank: Number(fct.Rank),
            category_detail: fct["Category Detail"],
            calculatrice_is_active: Boolean(
              fct["Calculatrice Is Active"] === "FAUX" ? 0 : 1
            ),
          });
        }
      });

      const newFunctionRanks = [
        {
          id: "40",
          rank: "4",
        },
        {
          id: "71",
          rank: "1",
        },
        {
          id: "58",
          rank: "3",
        },
        {
          id: "70",
          rank: "5",
        },
        {
          id: "72",
          rank: "2",
        },
        {
          id: "44",
          rank: "6",
        },
        {
          id: "41",
          rank: "7",
        },
        {
          id: "42",
          rank: "8",
        },
        {
          id: "43",
          rank: "9",
        },
        {
          id: "48",
          rank: "11",
        },
        {
          id: "49",
          rank: "12",
        },
        {
          id: "50",
          rank: "13",
        },
        {
          id: "51",
          rank: "14",
        },
        {
          id: "75",
          rank: "10",
        },
        {
          id: "52",
          rank: "15",
        },
        {
          id: "59",
          rank: "16",
        },
        {
          id: "45",
          rank: "17",
        },
        {
          id: "54",
          rank: "18",
        },
        {
          id: "55",
          rank: "19",
        },
        {
          id: "60",
          rank: "20",
        },
        {
          id: "61",
          rank: "21",
        },
        {
          id: "53",
          rank: "22",
        },
        {
          id: "62",
          rank: "23",
        },
        {
          id: "63",
          rank: "24",
        },
        {
          id: "64",
          rank: "25",
        },
        {
          id: "116",
          rank: "1",
        },
        {
          id: "118",
          rank: "2",
        },
        {
          id: "78",
          rank: "3",
        },
        {
          id: "114",
          rank: "4",
        },
        {
          id: "77",
          rank: "5",
        },
        {
          id: "106",
          rank: "6",
        },
        {
          id: "107",
          rank: "7",
        },
        {
          id: "108",
          rank: "8",
        },
        {
          id: "109",
          rank: "9",
        },
        {
          id: "110",
          rank: "10",
        },
      ];

      newFunctionRanks.map(async (x) => {
        let findFunction = null;
        findFunction = await models.HRFonctions.findOne({
          where: {
            id: Number(x.id),
          },
        });

        if (findFunction)
          await findFunction.update({
            rank: Number(x.rank),
            //position: x.Position,
          });
      });
    }

    if (isTj()) {
      const newFunctions = [
        {
          Label: "DG",
          Code: "DG",
          Rank: "1",
          "Category ID": "2",
          "Fonction onglet aggregat Category Detail": "F-TIT",
          "Calculatrice Is Active": "FAUX",
          Position: "Titulaire",
          "Recoded Function": "Fonctionnaire A-B-CBUR",
        },
        {
          Label: "DSGJ",
          Code: "DSGJ",
          Rank: "2",
          "Category ID": "2",
          "Fonction onglet aggregat Category Detail": "F-TIT",
          "Calculatrice Is Active": "FAUX",
          Position: "Titulaire",
          "Recoded Function": "Fonctionnaire A-B-CBUR",
        },
        {
          Label: "CHEF DE CABINET",
          Code: "CHCAB",
          Rank: "1",
          "Category ID": "3",
          "Fonction onglet aggregat Category Detail": "C",
          "Calculatrice Is Active": "VRAI",
          Position: "Contractuel",
          "Recoded Function": "Fonctionnaire A-B-CBUR",
        },
        {
          Label: "CHARGE DE MISSION",
          Code: "CMISSION",
          Rank: "2",
          "Category ID": "3",
          "Fonction onglet aggregat Category Detail": "C",
          "Calculatrice Is Active": "VRAI",
          Position: "Contractuel",
          "Recoded Function": "Fonctionnaire A-B-CBUR",
        },
        {
          Label: "DSGJ PLACÉ",
          Code: "DSGJ PLACÉ",
          Rank: "10",
          "Category ID": "2",
          "Fonction onglet aggregat Category Detail": "F-PLAC-ADD",
          "Calculatrice Is Active": "FAUX",
          Position: "Placé",
          "Recoded Function": "",
        },
      ];

      newFunctions.map(async (fct, index) => {
        let findFunction = null;
        findFunction = await models.HRFonctions.findOne({
          where: {
            code: fct.Code,
          },
        });

        if (!findFunction) {
          await models.HRFonctions.create({
            recoded_function: fct["Recoded Function"],
            position: fct.Position,
            code: fct.Code,
            label: fct.Label,
            category_id: fct["Category ID"],
            rank: Number(fct.Rank),
            category_detail: fct["Fonction onglet aggregat Category Detail"],
            calculatrice_is_active: Boolean(
              fct["Calculatrice Is Active"] === "FAUX" ? 0 : 1
            ),
          });
        }
      });

      const newFunctionRanks = [
        {
          id: "40",
          rank: "4",
        },
        {
          id: "71",
          rank: "1",
        },
        {
          id: "58",
          rank: "3",
        },
        {
          id: "70",
          rank: "5",
        },
        {
          id: "72",
          rank: "2",
        },
        {
          id: "44",
          rank: "6",
        },
        {
          id: "41",
          rank: "7",
        },
        {
          id: "42",
          rank: "8",
        },
        {
          id: "43",
          rank: "9",
        },
        {
          id: "48",
          rank: "11",
        },
        {
          id: "49",
          rank: "12",
        },
        {
          id: "50",
          rank: "13",
        },
        {
          id: "51",
          rank: "14",
        },
        {
          id: "75",
          rank: "10",
        },
        {
          id: "52",
          rank: "15",
        },
        {
          id: "59",
          rank: "16",
        },
        {
          id: "45",
          rank: "17",
        },
        {
          id: "54",
          rank: "18",
        },
        {
          id: "55",
          rank: "19",
        },
        {
          id: "60",
          rank: "20",
        },
        {
          id: "61",
          rank: "21",
        },
        {
          id: "53",
          rank: "22",
        },
        {
          id: "62",
          rank: "23",
        },
        {
          id: "63",
          rank: "24",
        },
        {
          id: "64",
          rank: "25",
        },
        {
          id: "73",
          rank: "1",
        },
        {
          id: "74",
          rank: "2",
        },
        {
          id: "32",
          rank: "3",
        },
        {
          id: "69",
          rank: "4",
        },
        {
          id: "33",
          rank: "5",
        },
        {
          id: "34",
          rank: "6",
        },
        {
          id: "66",
          rank: "7",
        },
        {
          id: "67",
          rank: "8",
        },
        {
          id: "68",
          rank: "9",
        },
        {
          id: "65",
          rank: "10",
        },
      ];

      newFunctionRanks.map(async (x) => {
        let findFunction = null;
        findFunction = await models.HRFonctions.findOne({
          where: {
            id: Number(x.id),
          },
        });

        if (findFunction)
          await findFunction.update({
            rank: Number(x.rank),
          });
      });
    }
  },
  down: (/*queryInterface , Sequelize*/) => {},
};
