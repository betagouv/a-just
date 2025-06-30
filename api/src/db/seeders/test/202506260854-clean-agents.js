const { Op } = require('sequelize')

module.exports = {
  up: async (queryInterface, Sequelize, models) => {
    // Trouver tous les HR avec first_name null
    const findAllWhere = await models.HumanResources.findAll({
      where: {
        first_name: { [Op.eq]: null },
      },
      include: [
        {
          model: models.HRSituations,
        },
        {
          model: models.HRIndisponibilities,
        },
      ],
    })

    console.log('Found records with null first_name:', findAllWhere.length)

    // Trouver ceux qui n'ont pas de jointures (situations ou indisponibilités)
    const hrWithoutJoins = findAllWhere.filter((hr) => {
      return hr.HRSituations.length === 0 && hr.HRIndisponibilities.length === 0
    })

    await queryInterface.sequelize.transaction(async (transaction) => {
      // Supprimer les enregistrements sans jointures
      for (const hr of hrWithoutJoins) {
        await models.HumanResources.destroy({
          where: {
            id: hr.id, // Assurez-vous de supprimer par ID
          },
          transaction, // Utiliser la transaction pour garantir l'atomicité
        })
      }
    })

    console.log('Records without any joins:', hrWithoutJoins.length)
  },
  down: (/*queryInterface , Sequelize*/) => {},
}
