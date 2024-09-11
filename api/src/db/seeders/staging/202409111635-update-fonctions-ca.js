import config from 'config'

module.exports = {
  up: async (queryInterface, Sequelize, models) => {
    // Maj fct coquille
    if (Number(config.juridictionType) === 1) {
      const findFct = await models.HRFonctions.findOne({
        where: {
          code: 'B GREF  PLACÉ',
        },
      })
      if (findFct) await findFct.update({ code: 'B GREF PLACÉ' })
    }

    // Gestion des placés
    const fctMagPlace = ['JP', 'VPP']
    const fctFoncPlace = ['A PLACÉ', 'B GREF PLACÉ', 'B PLACÉ', 'CB PLACÉ', 'CT PLACÉ']

    // ONLY FOR CA
    if (Number(config.juridictionType) === 1) {
      [fctMagPlace, fctFoncPlace].map((listCode) => {
        listCode.map(async (fctCode) => {
          const findFct = await models.HRFonctions.findOne({
            where: {
              code: fctCode,
            },
          })
          if (findFct) await findFct.update({ position: 'Placé' })
        })
      })
    }

    // Gestion des contactuels
    const fctMagCont = ['MHFJ', 'MHFNJ', 'MTT', 'MRES']
    const fctFoncCont = ['CONT A', 'CONT B', 'CONT C', 'CONT CT', 'CONT CB', 'CONT A JP', 'CONT B JP', 'CONT C JP', 'VAC', 'GRES']

    // ONLY FOR CA
    if (Number(config.juridictionType) === 1) {
      [fctMagCont, fctFoncCont].map((listCode) => {
        listCode.map(async (fctCode) => {
          const findFct = await models.HRFonctions.findOne({
            where: {
              code: fctCode,
            },
          })
          if (findFct) await findFct.update({ position: 'Contractuel' })
        })
      })
    }

    // Clean des fonction Greffe
    const fctToRemove = ['CM', 'CS', 'CHCAB', 'DG-A', 'DG']

    // ONLY FOR CA
    if (Number(config.juridictionType) === 1) {
      fctToRemove.map(async (fctCode) => {
        const findFct = await models.HRFonctions.findOne({
          where: {
            code: fctCode,
          },
        })
        if (findFct) await findFct.destroy()
      })
    }
  },
  down: (/*queryInterface , Sequelize*/) => {},
}
