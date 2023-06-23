module.exports = {
  up: async (queryInterface, Sequelize, models) => {
    const findGreffe = await models.HRCategories.findOne({
      where: {
        label: 'Greffe',
      },
    })

    const findBCont = await models.HRFonctions.findOne({
      where: {
        code: 'CONT B',
      },
    })

    if (findGreffe && findBCont) {
      const allSituationBCont = await models.HRSituations.findAll({
        where: {
          fonction_id: findBCont.dataValues.id,
        },
      })

      for (let i = 0; i < allSituationBCont.length; i++) {
        if (allSituationBCont[i])
          await allSituationBCont[i].update({
            category_id: findGreffe.dataValues.id,
          })
      }
    }

    const findACont = await models.HRFonctions.findOne({
      where: {
        code: 'CONT A',
      },
    })

    if (findGreffe && findACont) {
      const allSituationBCont = await models.HRSituations.findAll({
        where: {
          fonction_id: findACont.dataValues.id,
        },
      })

      for (let i = 0; i < allSituationBCont.length; i++) {
        if (allSituationBCont[i])
          await allSituationBCont[i].update({
            category_id: findGreffe.dataValues.id,
          })
      }
    }

    const findCCont = await models.HRFonctions.findOne({
      where: {
        code: 'CONT C',
      },
    })

    if (findGreffe && findCCont) {
      const allSituationCCont = await models.HRSituations.findAll({
        where: {
          fonction_id: findCCont.dataValues.id,
        },
      })

      for (let i = 0; i < allSituationCCont.length; i++) {
        if (allSituationCCont[i])
          await allSituationCCont[i].update({
            category_id: findGreffe.dataValues.id,
          })
      }
    }
  },
  down: (/*queryInterface , Sequelize*/) => {},
}
