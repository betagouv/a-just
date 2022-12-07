module.exports = {
  up: async (queryInterface, Sequelize, models) => {
    const list = await models.HumanResources.findAll()
    const regExpLiteral = new RegExp('^[0-9]+')

    for (let i = 0; i < list.length; i++) {
      const oldMatricule = list[i].dataValues.registration_number || ''
      let matricule = oldMatricule.match(regExpLiteral)
      if (matricule !== null) {
        list[i].update({ matricule: matricule[0] })
      }
    }
  },
  down: (/*queryInterface , Sequelize*/) => {},
}
