import config from 'config'

module.exports = {
  up: async (queryInterface, Sequelize, models) => {
    console.log('&&&&&&&&&& ---------------- ', config.juridictionType)
    if (config.juridictionType === 1)
      console.log(await models.Users.create(
        {
          email: 'canardjimmy2fois@a-just.fr',
          first_name: 'JJ',
          last_name: 'CC',
          password: '123456',
          status: 1,
          role: 2,
        },
        true,
      ))
  },
  down: (/*queryInterface , Sequelize*/) => {
  },
}
