import { Op } from 'sequelize'

module.exports = {
  up: async (queryInterface, Sequelize, models) => {
    const backups = await models.HRBackups.findAll({
      where: {
        label: {
          [Op.like]: 'TJ %',
        },
      },
    })

    for (const backup of backups) {
      const groupLabel = backup.label.replace(/^TJ\s+/, '').trim()
      if (!groupLabel) {
        continue
      }

      const [group] = await models.Groups.findOrCreate({
        where: { label: groupLabel },
        defaults: { label: groupLabel },
      })
      await backup.update({
        group_id: group.id,
        group_id_rank: 0,
      })
    }
  },
  down: (/*queryInterface, Sequelize*/) => { },
}
