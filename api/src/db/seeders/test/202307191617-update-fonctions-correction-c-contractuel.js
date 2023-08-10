module.exports = {
  up: async (queryInterface, Sequelize, models) => {
    /**
     * CATEGORIES
     */
    const findEAMCat = await models.HRCategories.findOne({
      where: {
        label: 'Autour du magistrat',
      },
    })

    const findGreffeCat = await models.HRCategories.findOne({
      where: {
        label: 'Greffe',
      },
    })

    /**
     * CONT C
     */
    if (findEAMCat && findGreffeCat) {
      const findCContEAMFct = await models.HRFonctions.findOne({
        where: {
          code: 'CONT C JP',
          category_id: findEAMCat.dataValues.id
        },
      })

      const findCContGreffeFct = await models.HRFonctions.findOne({
        where: {
          code: 'CONT C JP',
          category_id: findGreffeCat.dataValues.id
        },
      })

      if (findCContEAMFct && findCContGreffeFct) {
        const allSituationCCont = await models.HRSituations.findAll({
          where: {
            category_id: findEAMCat.dataValues.id,
            fonction_id: findCContGreffeFct.dataValues.id,
          },
        })

        for (let i = 0; i < allSituationCCont.length; i++) {
          if (allSituationCCont[i])
            await allSituationCCont[i].update({
              fonction_id: findCContEAMFct.dataValues.id,
            })
        }
      }


      /**
     * CONT B
     */
      const findBContEAMFct = await models.HRFonctions.findOne({
        where: {
          code: 'CONT B JP',
          category_id: findEAMCat.dataValues.id
        },
      })

      const findBContGreffeFct = await models.HRFonctions.findOne({
        where: {
          code: 'CONT B JP',
          category_id: findGreffeCat.dataValues.id
        },
      })

      if (findBContEAMFct && findBContGreffeFct) {
        const allSituationBCont = await models.HRSituations.findAll({
          where: {
            category_id: findEAMCat.dataValues.id,
            fonction_id: findBContGreffeFct.dataValues.id,
          },
        })

        for (let i = 0; i < allSituationBCont.length; i++) {
          if (allSituationBCont[i])
            await allSituationBCont[i].update({
              fonction_id: findBContEAMFct.dataValues.id,
            })
        }
      }

      /**
      * CONT A
      */
      const findAContEAMFct = await models.HRFonctions.findOne({
        where: {
          code: 'CONT A JP',
          category_id: findEAMCat.dataValues.id
        },
      })

      const findAContGreffeFct = await models.HRFonctions.findOne({
        where: {
          code: 'CONT A JP',
          category_id: findGreffeCat.dataValues.id
        },
      })

      if (findAContEAMFct && findAContGreffeFct) {
        const allSituationACont = await models.HRSituations.findAll({
          where: {
            category_id: findEAMCat.dataValues.id,
            fonction_id: findAContGreffeFct.dataValues.id,
          },
        })

        for (let i = 0; i < allSituationACont.length; i++) {
          if (allSituationACont[i])
            await allSituationACont[i].update({
              fonction_id: findAContEAMFct.dataValues.id,
            })
        }
      }

    }
  },
  down: (/*queryInterface , Sequelize*/) => { },
}
