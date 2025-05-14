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
        await models.HRFonctions.create({
          recoded_function: fct["Recoded Function"],
          position: fct.Position,
          code: fct.Code,
          label: fct.Label,
          category_id: fct["Category ID"],
          rank: Number(fct.Rank),
          category_detail: fct["Category Detail"],
          calculatrice_is_active: Boolean(fct["Calculatrice Is Active"]==="FAUX"?0:1),
        });
      });

      const newFunctionRanks = [
        {
          ID: "84",
          Rank: "4",
          Position: "Titulaire",
        },
        {
          ID: "78",
          Rank: "3",
          Position: "Contractuel",
        },
        {
          ID: "114",
          Rank: "4",
          Position: "Contractuel",
        },
        {
          ID: "116",
          Rank: "3",
          Position: "Titulaire",
        },
        {
          ID: "115",
          Rank: "5",
          Position: "Titulaire",
        },
        {
          ID: "77",
          Rank: "5",
          Position: "Contractuel",
        },
        {
          ID: "106",
          Rank: "6",
          Position: "Contractuel",
        },
        {
          ID: "85",
          Rank: "6",
          Position: "Titulaire",
        },
        {
          ID: "107",
          Rank: "7",
          Position: "Contractuel",
        },
        {
          ID: "108",
          Rank: "8",
          Position: "Contractuel",
        },
        {
          ID: "87",
          Rank: "7",
          Position: "Titulaire",
        },
        {
          ID: "88",
          Rank: "8",
          Position: "Titulaire",
        },
        {
          ID: "86",
          Rank: "9",
          Position: "Titulaire",
        },
        {
          ID: "89",
          Rank: "11",
          Position: "Placé",
        },
        {
          ID: "90",
          Rank: "12",
          Position: "Placé",
        },
        {
          ID: "91",
          Rank: "13",
          Position: "Placé",
        },
        {
          ID: "92",
          Rank: "14",
          Position: "Placé",
        },
        {
          ID: "95",
          Rank: "15",
          Position: "Placé",
        },
        {
          ID: "93",
          Rank: "16",
          Position: "Contractuel",
        },
        {
          ID: "94",
          Rank: "17",
          Position: "Contractuel",
        },
        {
          ID: "97",
          Rank: "18",
          Position: "Contractuel",
        },
        {
          ID: "99",
          Rank: "19",
          Position: "Contractuel",
        },
        {
          ID: "100",
          Rank: "20",
          Position: "Contractuel",
        },
        {
          ID: "101",
          Rank: "21",
          Position: "Contractuel",
        },
        {
          ID: "103",
          Rank: "22",
          Position: "Contractuel",
        },
        {
          ID: "96",
          Rank: "23",
          Position: "Contractuel",
        },
        {
          ID: "98",
          Rank: "24",
          Position: "Contractuel",
        },
        {
          ID: "102",
          Rank: "25",
          Position: "Contractuel",
        },
        {
          ID: "109",
          Rank: "9",
          Position: "Contractuel",
        },
        {
          ID: "110",
          Rank: "10",
          Position: "Contractuel",
        },
      ];

      newFunctionRanks.map(async (x) => {
        let findFunction = null;
        console.log(x.ID)
        findFunction = await models.HRFonctions.findOne({
          where: {
            id: Number(x.ID),
          },
        });

        if (findFunction)
          await findFunction.update({
            rank: Number(x.Rank),
            position: x.Position,
          });
      });
    }

    if (isTj()) {

      const newFunctions = [
        {
            "Label": "DG",
            "Code": "DG",
            "Rank": "1",
            "Category ID": "2",
            "Fonction onglet aggregat Category Detail": "F-TIT",
            "Calculatrice Is Active": "FAUX",
            "Position": "Titulaire",
            "Recoded Function": "Fonctionnaire A-B-CBUR"
        },
        {
            "Label": "DSGJ",
            "Code": "DSGJ",
            "Rank": "2",
            "Category ID": "2",
            "Fonction onglet aggregat Category Detail": "F-TIT",
            "Calculatrice Is Active": "FAUX",
            "Position": "Titulaire",
            "Recoded Function": "Fonctionnaire A-B-CBUR"
        },
        {
            "Label": "CHEF DE CABINET",
            "Code": "CHCAB",
            "Rank": "1",
            "Category ID": "3",
            "Fonction onglet aggregat Category Detail": "C",
            "Calculatrice Is Active": "VRAI",
            "Position": "Contractuel",
            "Recoded Function": "Fonctionnaire A-B-CBUR"
        },
        {
            "Label": "CHARGE DE MISSION",
            "Code": "CMISSION",
            "Rank": "2",
            "Category ID": "3",
            "Fonction onglet aggregat Category Detail": "C",
            "Calculatrice Is Active": "VRAI",
            "Position": "Contractuel",
            "Recoded Function": "Fonctionnaire A-B-CBUR"
        },
        {
            "Label": "DSGJ PLACÉ",
            "Code": "DSGJ PLACÉ",
            "Rank": "10",
            "Category ID": "2",
            "Fonction onglet aggregat Category Detail": "F-PLAC-ADD",
            "Calculatrice Is Active": "FAUX",
            "Position": "Placé",
            "Recoded Function": ""
        }
    ];

      newFunctions.map(async (fct, index) => {
        await models.HRFonctions.create({
          recoded_function: fct["Recoded Function"],
          position: fct.Position,
          code: fct.Code,
          label: fct.Label,
          category_id: fct["Category ID"],
          rank: Number(fct.Rank),
          category_detail: fct["Fonction onglet aggregat Category Detail"],
          calculatrice_is_active: Boolean(fct["Calculatrice Is Active"]==="FAUX"?0:1),
        });
      });

      const newFunctionRanks = [
          {
              "ID": "116",
              "Rank": "3"
          },
          {
              "ID": "84",
              "Rank": "4"
          },
          {
              "ID": "115",
              "Rank": "5"
          },
          {
              "ID": "85",
              "Rank": "6"
          },
          {
              "ID": "78",
              "Rank": "3"
          },
          {
              "ID": "87",
              "Rank": "7"
          },
          {
              "ID": "88",
              "Rank": "8"
          },
          {
              "ID": "86",
              "Rank": "9"
          },
          {
              "ID": "89",
              "Rank": "11"
          },
          {
              "ID": "114",
              "Rank": "4"
          },
          {
              "ID": "",
              "Rank": "12"
          },
          {
              "ID": "91",
              "Rank": "13"
          },
          {
              "ID": "92",
              "Rank": "14"
          },
          {
              "ID": "95",
              "Rank": "15"
          },
          {
              "ID": "93",
              "Rank": "16"
          },
          {
              "ID": "94",
              "Rank": "17"
          },
          {
              "ID": "97",
              "Rank": "18"
          },
          {
              "ID": "99",
              "Rank": "19"
          },
          {
              "ID": "100",
              "Rank": "20"
          },
          {
              "ID": "101",
              "Rank": "21"
          },
          {
              "ID": "77",
              "Rank": "5"
          },
          {
              "ID": "106",
              "Rank": "6"
          },
          {
              "ID": "103",
              "Rank": "22"
          },
          {
              "ID": "96",
              "Rank": "23"
          },
          {
              "ID": "98",
              "Rank": "24"
          },
          {
              "ID": "107",
              "Rank": "7"
          },
          {
              "ID": "108",
              "Rank": "8"
          },
          {
              "ID": "102",
              "Rank": "25"
          },
          {
              "ID": "109",
              "Rank": "9"
          },
          {
              "ID": "110",
              "Rank": "10"
          }
      ];

      newFunctionRanks.map(async (x) => {
        let findFunction = null;
        findFunction = await models.HRFonctions.findOne({
          where: {
            id: Number(x.ID),
          },
        });

        if (findFunction)
          await findFunction.update({
            rank: Number(x.Rank),
          });
      });

    }
  },
  down: (/*queryInterface , Sequelize*/) => {},
};
