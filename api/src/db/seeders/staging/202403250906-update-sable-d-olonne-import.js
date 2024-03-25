module.exports = {
  up: async (queryInterface, Sequelize, models) => {
    const hrSable = await models.HumanRessources.findOne({
      where: {
        label: 'Fonctionnaire',
      },
      raw: true,
    })

    if (findFonc) {
      const findA = await models.HRFonctions.findOne({
        where: {
          code: 'A',
        },
      })

      if (findA) {
        await models.HRFonctions.create({
          label: 'B greffier',
          code: 'B greffier',
          rank: findA.dataValues.rank,
          category_id: findFonc.id,
        })
      }

      const findB = await models.HRFonctions.findOne({
        where: {
          code: 'B',
        },
      })
      if (findB) {
        await findB.update({
          label: 'B placé',
          code: 'B placé',
        })
      }

      const findCB = await models.HRFonctions.findOne({
        where: {
          code: 'CB',
        },
      })
      if (findCB) {
        await findCB.update({
          label: 'CB placé',
          code: 'CB placé',
        })
      }

      const findCT = await models.HRFonctions.findOne({
        where: {
          code: 'CT',
        },
      })
      if (findCT) {
        await findCT.update({
          label: 'CT placé',
          code: 'CT placé',
        })
      }

      // reorder
      const findAllFonctionnaire = await models.HRFonctions.findAll({
        where: {
          category_id: findFonc.id,
        },
        order: [['rank', 'asc'], ['id', 'asc']],
      })
      for (let i = 0; i < findAllFonctionnaire.length; i++) {
        await findAllFonctionnaire[i].update({
          rank: i,
        })
      }
    }
    throw "ICI"
  },
  down: (/*queryInterface , Sequelize*/) => { },
}
