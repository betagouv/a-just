
module.exports = {
    up: async (queryInterface, Sequelize, models) => {
        const user = await models.Users.findOne({
            where: {
                email: 'utilisateurtest@a-just.fr',
            }
        })
        if (user) {
            await models.Users.updatePassword(user.dataValues.id, '@bUgGD25gX1b')
        }
    },
    down: (/*queryInterface , Sequelize*/) => {},
  }
  