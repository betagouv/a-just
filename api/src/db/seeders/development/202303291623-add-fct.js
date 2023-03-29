module.exports = {
  up: async (queryInterface, Sequelize, models) => {
    const findAllMTIT = await models.HRFonctions.findAll({
      where: {
        code: ['P', '1VP', '1VPA', '1VPCP', '1VPE', '1VPI', 'VPSG', '1VPAP', '1VPLD', 'VP', 'VPCP', 'VPI', 'VPAP', 'VPLD', 'J', 'JCP', 'JE', 'JI', 'JAP'],
        category_id: 1,
      },
    })
    for (let i = 0; i < findAllMTIT.length; i++) {
      await findAllMTIT[i].update({
        category_detail: 'M-TIT',
      })
    }

    throw new Error('Parameter is not a number!')

    const findBP = await models.HRFonctions.findOne({
      where: {
        code: 'P',
        category_id: 1,
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
  },
  down: (/*queryInterface , Sequelize*/) => {},
}
