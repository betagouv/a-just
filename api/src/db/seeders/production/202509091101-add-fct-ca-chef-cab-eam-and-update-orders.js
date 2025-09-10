const { isCa } = require('../../../utils/ca')

module.exports = {
  up: async (queryInterface, Sequelize, models) => {
    if (isCa()) {
      const findMagCat = await models.HRCategories.findOne({
        where: {
          label: 'Magistrat',
        },
      })

      const findGreffeCat = await models.HRCategories.findOne({
        where: {
          label: 'Greffe',
        },
      })

      const findEAMCat = await models.HRCategories.findOne({
        where: {
          label: 'Autour du magistrat',
        },
      })

      // update rank EAM and create CHCAB
      if (findEAMCat) {
        const orderedFctEAM = [
          {
            Code: 'CHCAB',
            Rank: '1',
          },
          {
            Code: 'CMISSION',
            Rank: '2',
          },
          {
            Code: 'AS',
            Rank: '3',
          },
          {
            Code: 'Att. J',
            Rank: '4',
          },
          {
            Code: 'JA',
            Rank: '5',
          },
          {
            Code: 'ADJ',
            Rank: '6',
          },
          {
            Code: 'CONT A JP',
            Rank: '7',
          },
          {
            Code: 'CONT B JP',
            Rank: '8',
          },
          {
            Code: 'CONT C JP',
            Rank: '9',
          },
          {
            Code: 'PPI',
            Rank: '10',
          },
        ]

        orderedFctEAM.map(async (x) => {
          let findFunction = null
          findFunction = await models.HRFonctions.findOne({
            where: {
              code: x.Code,
              category_id: findEAMCat.dataValues.id,
            },
          })

          if (findFunction)
            await findFunction.update({
              rank: Number(x.Rank),
            })
        })

        await models.HRFonctions.create({
          recoded_function: 'Fonctionnaire A-B-CBUR',
          position: 'Contractuel',
          code: 'CHCAB',
          label: 'CHEF DE CABINET',
          category_id: findEAMCat.dataValues.id,
          rank: 1,
          category_detail: 'C',
          calculatrice_is_active: true,
        })
      }

      if (findMagCat) {
        const orderedFctMag = [
          {
            Code: 'PP',
            Rank: '0',
          },
          {
            Code: '1PC',
            Rank: '1',
          },
          {
            Code: 'PC',
            Rank: '2',
          },
          {
            Code: 'PCINS',
            Rank: '3',
          },
          {
            Code: 'CSG',
            Rank: '4',
          },
          {
            Code: 'C',
            Rank: '5',
          },
          {
            Code: 'VPP',
            Rank: '6',
          },
          {
            Code: 'JP',
            Rank: '7',
          },
          {
            Code: 'MHFJ',
            Rank: '8',
          },
          {
            Code: 'MHFNJ',
            Rank: '9',
          },
          {
            Code: 'MRES',
            Rank: '10',
          },
          {
            Code: 'MTT',
            Rank: '11',
          },
        ]
        orderedFctMag.map(async (x) => {
          let findFunction = null
          findFunction = await models.HRFonctions.findOne({
            where: {
              code: x.Code,
              category_id: findMagCat.dataValues.id,
            },
          })

          if (findFunction)
            await findFunction.update({
              rank: Number(x.Rank),
            })
        })
      }

      // update rank greffe
      if (findGreffeCat) {
        const orderedFctGreffe = [
          {
            Code: 'DG',
            Rank: '1',
          },
          {
            Code: 'DSGJ',
            Rank: '2',
          },
          {
            Code: 'A',
            Rank: '4',
          },
          {
            Code: 'CHCAB',
            Rank: '3',
          },
          {
            Code: 'A GREFFIER',
            Rank: '5',
          },
          {
            Code: 'B',
            Rank: '6',
          },
          {
            Code: 'SA',
            Rank: '7',
          },
          {
            Code: 'CB',
            Rank: '8',
          },
          {
            Code: 'CT',
            Rank: '9',
          },
          {
            Code: 'DSGJ PLACE',
            Rank: '10',
          },
          {
            Code: 'A PLACÉ',
            Rank: '11',
          },
          {
            Code: 'B GREF PLACÉ',
            Rank: '12',
          },
          {
            Code: 'B PLACÉ',
            Rank: '13',
          },
          {
            Code: 'CB PLACÉ',
            Rank: '14',
          },
          {
            Code: 'CT PLACÉ',
            Rank: '15',
          },
          {
            Code: 'GRES',
            Rank: '16',
          },
          {
            Code: 'CONT A',
            Rank: '17',
          },
          {
            Code: 'CONT B',
            Rank: '18',
          },
          {
            Code: 'CONT C',
            Rank: '19',
          },
          {
            Code: 'CONT CB',
            Rank: '20',
          },
          {
            Code: 'CONT CT',
            Rank: '21',
          },
          {
            Code: 'VAC',
            Rank: '22',
          },
          {
            Code: 'CONT A JP',
            Rank: '23',
          },
          {
            Code: 'CONT B JP',
            Rank: '24',
          },
          {
            Code: 'CONT C JP',
            Rank: '25',
          },
        ]

        orderedFctGreffe.map(async (x) => {
          let findFunction = null
          findFunction = await models.HRFonctions.findOne({
            where: {
              code: x.Code,
              category_id: findGreffeCat.dataValues.id,
            },
          })

          if (findFunction)
            await findFunction.update({
              rank: Number(x.Rank),
            })
        })
      }
    }
  },
  down: (/*queryInterface , Sequelize*/) => {},
}
