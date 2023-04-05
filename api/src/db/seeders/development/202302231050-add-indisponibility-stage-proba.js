module.exports = {
  up: async (queryInterface, Sequelize, models) => {
    const findCont = await models.ContentieuxReferentiels.findOne({
      where: {
        label: 'Indisponibilité',
      },
      raw: true,
    })

    if (findCont) {
      const created = await models.ContentieuxReferentiels.create({
        label: 'Stage probatoire dans une autre juridiction',
        parent_id: findCont.id,
        code_import: '12.99',
      })

      //throw new Error('ERR')
    }
  },
  down: (/*queryInterface , Sequelize*/) => {},
}
