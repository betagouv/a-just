module.exports = {
  up: async (queryInterface, Sequelize, models) => {
    const findBP = await models.HRFonctions.findOne({
      where: {
        code: 'B placé',
      },
    })
    if (findBP) {
      await findBP.update({
        label: 'B',
        code: 'B',
      })
    }

    const findCBP = await models.HRFonctions.findOne({
      where: {
        code: 'CB placé',
      },
    })
    if (findCBP) {
      await findCBP.update({
        label: 'CB',
        code: 'CB',
      })
    }

    const findCTP = await models.HRFonctions.findOne({
      where: {
        code: 'CT placé',
      },
    })
    if (findCTP) {
      await findCTP.update({
        label: 'CT',
        code: 'CT',
      })
    }

    await models.HRFonctions.create({
      label: 'A placé',
      code: 'A placé',
      rank: 100,
      category_id: findFonc.id,
    })

    await models.HRFonctions.create({
      label: 'B greffier placé',
      code: 'B greffier placé',
      rank: 100,
      category_id: findFonc.id,
    })

    await models.HRFonctions.create({
      label: 'B placé',
      code: 'B placé',
      rank: 100,
      category_id: findFonc.id,
    })

    await models.HRFonctions.create({
      label: 'CB placé',
      code: 'CB placé',
      rank: 100,
      category_id: findFonc.id,
    })

    await models.HRFonctions.create({
      label: 'CT placé',
      code: 'CT placé',
      rank: 100,
      category_id: findFonc.id,
    })

    // reorder
    const findAllFonctionnaire = await models.HRFonctions.findAll({
      where: {
        category_id: findFonc.id,
      },
      order: [
        ['rank', 'asc'],
        ['id', 'asc'],
      ],
    })
    for (let i = 0; i < findAllFonctionnaire.length; i++) {
      await findAllFonctionnaire[i].update({
        rank: i,
      })
    }
  },
  down: (/*queryInterface , Sequelize*/) => {},
}
