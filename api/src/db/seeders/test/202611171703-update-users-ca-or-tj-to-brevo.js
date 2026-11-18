import { sentEmailSendinblueUserList } from '../../../utils/email'

module.exports = {
    up: async (queryInterface, Sequelize, models) => {
        if (process.env.NODE_ENV === 'test') return

        const users = await models.Users.findAll()

        for (let i = 0; i < users.length; i++) {
            try {
                await sentEmailSendinblueUserList(users[i].dataValues, (await models.UserVentilations.getUserVentilations(users[i].dataValues.id)).length)
            } catch (e) {
                console.log(e)
            }
        }
    },
    down: (/*queryInterface , Sequelize*/) => { },
}
