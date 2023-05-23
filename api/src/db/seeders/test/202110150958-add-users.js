module.exports = {
  up: async (queryInterface, Sequelize, models) => {
    await models.Users.create(
      {
        email: 'fx@a-just.fr',
        first_name: 'François-Xavier',
        last_name: 'Montigny',
        password: '123456',
        status: 1,
        role: 1,
      },
      true
    )

    await models.Users.create(
      {
        email: 'redwane.zafari@a-just.fr',
        first_name: 'Redwane',
        last_name: 'Zafari',
        password: '123456',
        status: 1,
        role: 2,
      },
      true
    )

    const users = await models.Users.findAll({
      where: {
        email: ['redwane.zafari@a-just.fr', 'fx@a-just.fr'],
      },
    })

    for (let i = 0; i < users.length; i++) {
      await models.Users.updatePassword(users[i].dataValues.id, '123456')
    }
  },
  down: (/*queryInterface , Sequelize*/) => {},
}
