import { Op } from 'sequelize'

module.exports = {
  up: async (queryInterface, Sequelize, models) => {

    const tprx = await models.HumanResources.findAll({
      where: {
        juridiction: { [Op.startsWith]: 'TPR' },
      }
    })

    for (let i = 0; i < tprx.length; i++) {
      await tprx[i].update({
        juridiction: tprx[i].juridiction.replace("TPR ", "TPRX "),
      })
    }

    const exceptionLabels = [
      {
        "import": "GTJ PARIS",
        "ielst": "TJ PARIS"
      },
      {
        "import": "TJ BRIEY",
        "ielst": "TJ VAL DE BRIEY"
      },
      {
        "import": "TPRX SAINT GERMAIN EN LAYE",
        "ielst": "TPRX SAINT-GERMAIN-EN-LAYE"
      },
      {
        "import": "TPRX MONTREUIL SUR MER",
        "ielst": "TPRX MONTREUIL (62)"
      },
      {
        "import": "TJ ST OMER",
        "ielst": "TJ SAINT OMER"
      },
      {
        "import": "TPRX SAINT AVOLD",
        "ielst": "TPRX ST AVOLD"
      },
      {
        "import": "TPRX SAINT GIRONS",
        "ielst": "TPRX ST GIRONS"
      },
      {
        "import": "TPRX SAINT PAUL",
        "ielst": "TPRX ST PAUL"
      },
      {
        "import": "TPRX SAINT BENOIT",
        "ielst": "TPRX ST BENOIT"
      },
      {
        "import": "TPRX MONTREUIL SOUS BOIS",
        "ielst": "TPRX MONTREUIL (93)"
      },
      {
        "import": "TPRX SAINT OUEN",
        "ielst": "TPRX ST OUEN"
      },
      {
        "import": "TPRX SAINT DENIS",
        "ielst": "TPRX ST DENIS"
      },
      {
        "import": "TJ LES SABLES D' OLONNE",
        "ielst": "TJ LES SABLES D'OLONNE"
      },
      {
        "import": "TJ DIGNE",
        "ielst": "TJ DIGNE LES BAINS"
      },
      {
        "import": "TPRX SAINT CLAUDE",
        "ielst": "TPRX ST CLAUDE"
      },
      {
        "import": "TPRX SAINT DIZIER",
        "ielst": "TPRX ST DIZIER"
      },
      {
        "import": "SEC KONE",
        "ielst": "TPI NOUMEA"
      },
      {
        "import": "SEC LIFOU",
        "ielst": "TPI NOUMEA"
      }
    ]

    for (let j = 0; j < exceptionLabels.length; j++) {

      const list = await models.HumanResources.findAll({
        where: {
          juridiction: exceptionLabels[j]["import"]
        }
      })

      for (let k = 0; k < list.length; k++) {
        await list[k].update({
          juridiction: exceptionLabels[j]["ielst"],
        })
      }
    }

  },
  down: (/*queryInterface , Sequelize*/) => { },
}