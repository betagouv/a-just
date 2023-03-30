module.exports = {
  up: async (queryInterface, Sequelize, models) => {
    const findAllMTIT = await models.HRFonctions.findAll({
      where: {
        code: [
          'P',
          '1VP',
          '1VPA',
          '1VPCP',
          '1VPE',
          '1VPI',
          'VPSG',
          '1VPAP',
          '1VPLD',
          'VP',
          'VPCP',
          'VPI',
          'VPAP',
          'VPLD',
          'J',
          'JCP',
          'JE',
          'JI',
          'JAP',
          'VPE',
        ],
        category_id: 1,
      },
    })
    for (let i = 0; i < findAllMTIT.length; i++) {
      await findAllMTIT[i].update({
        category_detail: 'M-TIT',
      })
    }

    console.log(findAllMTIT)
    const findAllMPLACADD = await models.HRFonctions.findAll({
      where: {
        code: ['VP PLACÉ', 'J. PLACÉ'],
        category_id: 1,
      },
    })
    for (let i = 0; i < findAllMPLACADD.length; i++) {
      await findAllMPLACADD[i].update({
        category_detail: 'M-PLAC-ADD',
      })
    }

    const findAllFTIT = await models.HRFonctions.findAll({
      where: {
        code: ['B greffier', 'A', 'CB', 'CT', 'SA', 'Vacataire', 'B contractuel', 'C contractuel'],
        category_id: 2,
      },
    })
    for (let i = 0; i < findAllFTIT.length; i++) {
      await findAllFTIT[i].update({
        category_detail: 'F-TIT',
      })
    }

    const findAllFPLACADD = await models.HRFonctions.findAll({
      where: {
        code: ['A placé', 'B greffier placé', 'B placé', 'CB placé', 'CT placé'],
        category_id: 2,
      },
    })
    for (let i = 0; i < findAllFPLACADD.length; i++) {
      await findAllFPLACADD[i].update({
        category_detail: 'F-PLAC-ADD',
      })
    }
    //const { Op } = require('sequelize')
    const findAllC = await models.HRFonctions.findAll({
      where: {
        code: [
          'Assistant de justice',
          'Assistant spécialisé',
          'Autre',
          'Contractuel A',
          'Contractuel B',
          'Contractuel C',
          'Juriste assistant',
          'Magistrat à titre temporaire',
          'Magistrat honoraire (MHFJ)',
          'Vacataire',
        ],
        category_id: 3,
      },
    })
    for (let i = 0; i < findAllC.length; i++) {
      await findAllC[i].update({
        category_detail: 'C',
      })
    }
  },
  down: (/*queryInterface , Sequelize*/) => {},
}
