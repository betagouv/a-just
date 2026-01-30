// Ne surtout pas lancer cette migration en prod, elle est uniquement pour le sandbox et la staging
// Cette migration supprime tous les utilisateurs ne faisant pas partie de l'équipe A-JUST
// Afin d'éviter que nos utilisateurs puissent se connecter à l'application hors de la production
module.exports = {
  up: async (queryInterface, Sequelize, models) => {
    const users = await models.Users.findAll({
      where: {
        role: null,
      },
    })

    console.log(`Found ${users.length} users with no role to delete`)

    for (let i = 0; i < users.length; i++) {
      await users[i].destroy()
      console.log(`Deleted user ${users[i].id} - ${users[i].email}`)
    }

    console.log(`Cleanup complete: ${users.length} users deleted`)
  },
  down: (/*queryInterface, Sequelize*/) => {},
}
