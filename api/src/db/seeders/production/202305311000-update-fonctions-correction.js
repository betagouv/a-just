module.exports = {
  up: async (queryInterface, Sequelize, models) => {
    const findEAM = await models.HRCategories.findOne({
      where: {
        label: 'Autour du Juge',
      },
    })
    if (findEAM) await findEAM.update({ label: 'Autour du magistrat' })

    const findMag = await models.HRCategories.findOne({
      where: {
        label: 'Magistrat',
      },
    })

    const findMTT = await models.HRFonctions.findOne({
      where: {
        code: 'MTT',
      },
    })

    if (findMTT && findMag) {
      const allSituationMTTMag = await models.HRSituations.findAll({
        where: {
          fonction_id: findMTT.dataValues.id,
        },
      })

      for (let i = 0; i < allSituationMTTMag.length; i++) {
        if (allSituationMTTMag[i])
          await allSituationMTTMag[i].update({
            category_id: findMag.dataValues.id,
          })
      }
    }
  },
  down: (/*queryInterface , Sequelize*/) => {},
}
