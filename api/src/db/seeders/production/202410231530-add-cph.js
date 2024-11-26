import config from 'config';

module.exports = {
  up: async (queryInterface, Sequelize, models) => {
    const CPH = [
      {
        "Type de juridiction": "CPH",
        "Code Ca": 100037,
        "CA": "CA NOUMEA",
        "Code TJ": 100223,
        "TJ": "TPI NOUMEA",
        "Code TPRX/CPH": 916801,
        "TPRX / CPH": "CPH NOUMEA",
      },
      {
        "Type de juridiction": "CPH",
        "Code Ca": 100036,
        "CA": "CA PAPEETE",
        "Code TJ": 100222,
        "TJ": "TPI PAPEETE",
        "Code TPRX/CPH": 916803,
        "TPRX / CPH": "CPH PAPEETE",
      },
      {
        "Type de juridiction": "CPH",
        "Code Ca": 914815,
        "CA": "CA PARIS",
        "Code TJ": 915273,
        "TJ": "TJ PARIS",
        "Code TPRX/CPH": 915272,
        "TPRX / CPH": "CPH PARIS",
      },
      {
        "Type de juridiction": "CPH",
        "Code Ca": 100033,
        "CA": "CA ST DENIS",
        "Code TJ": 941809,
        "TJ": "TJ MAMOUDZOU",
        "Code TPRX/CPH": 919416,
        "TPRX / CPH": "CPH MAMOUDZOU",
      },
      {
        "Type de juridiction": "CPH",
        "Code Ca": 100030,
        "CA": "CA LIMOGES",
        "Code TJ": 948314,
        "TJ": "TJ TULLE",
        "Code TPRX/CPH": 100989,
        "TPRX / CPH": "CPH TULLE",
      },
      {
        "Type de juridiction": "CPH",
        "Code Ca": 100008,
        "CA": "CA TOULOUSE",
        "Code TJ": 948313,
        "TJ": "TJ ST GAUDENS",
        "Code TPRX/CPH": 101018,
        "TPRX / CPH": "CPH ST GAUDENS",
      },
      {
        "Type de juridiction": "CPH",
        "Code Ca": 100015,
        "CA": "CA ANGERS",
        "Code TJ": 948312,
        "TJ": "TJ SAUMUR",
        "Code TPRX/CPH": 101066,
        "TPRX / CPH": "CPH SAUMUR",
      }
    ]

    // Only for TJ
    if (Number(config.juridictionType) === 0) {
      for (let i = 0; i < CPH.length; i++) {

        // catch parent
        console.log('IELST:', CPH[1] )
        const parent = await models.TJ.findOne({
          where : {
            i_elst: CPH[i]['Code TJ'],
          },
          raw: true,
        })

        if (parent) {
          await models.TJ.create({
            i_elst: CPH[i]['Code TPRX/CPH'],
            label: CPH[i]['TPRX / CPH'],
            type: CPH[i]['Type de juridiction'],
            parent_id: parent.id
          })
        }
      }
    }
  },
  down: (/*queryInterface , Sequelize*/) => {},
}
