// Ne surtout pas lancer cette migration en prod, elle est uniquement pour le sandbox et la staging
// Cette migration supprime tous les utilisateurs ne faisant pas partie de l'équipe A-JUST

const { Op } = require("sequelize")

// Afin d'éviter que nos utilisateurs puissent se connecter à l'application hors de la production
module.exports = {
  up: async (queryInterface, Sequelize, models) => {
    const referentiels = await models.ContentieuxReferentiels.findAll({
      where: {
        label: {
          [Op.like]: '%JA affectés%',
        },
      },
    })

    for (let i = 0; i < referentiels.length; i++) {
      await referentiels[i].update({
        label: referentiels[i].dataValues.label.replace('JA affectés', 'AJ affectés'),
      })
    }
  },
  down: (/*queryInterface, Sequelize*/) => { },
}
