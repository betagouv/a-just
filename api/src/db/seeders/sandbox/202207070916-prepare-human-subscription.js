module.exports = {
  up: async (queryInterface, Sequelize, models) => {
    const people = await models.HumanResources.findAll()

    for (let i = 0; i < people.length; i++) {
      const person = people[i]
      let matricule = person.dataValues.registration_number

      // case user doesnt have matricule
      if(matricule === person.dataValues.last_name) {
        matricule = `0${person.dataValues.last_name || ''}${person.dataValues.first_name || ''}`
      } else {
        matricule = `${matricule}${person.dataValues.last_name || ''}${person.dataValues.first_name || ''}`
      }

      await person.update({
        registration_number: matricule,
      })
    }

  },
  down: (/*queryInterface , Sequelize*/) => {},
}
