import { Op } from 'sequelize'

module.exports = {
  up: async (queryInterface, Sequelize, models) => {
    // Récupérer la liste des TJ avec un parent et activé ou non
    const tjs = await models.TJ.findAll({
      where: {
        parent_id: { [Op.ne]: null },
      },
      raw: true,
    })

    for (const tj of tjs) {
      const getParentTJ = await models.TJ.findById(tj.parent_id)
      if (!getParentTJ) {
        continue
      }

      await models.TJ.updateJuridiction(tj.id, 'enabled', getParentTJ.dataValues.enabled ? 'oui' : 'non')
    }

    // Affectation des BACKUP_ID aux groupes
    const HRBackupsAlone = await models.HRBackups.findAll({
      where: {
        group_id: null,
      },
      raw: true,
    })

    for (const backup of HRBackupsAlone) {
      console.log(backup.id)

      const getTJ = await models.TJ.findOne({
        where: {
          backup_id: backup.id,
        },
      })
      if (!getTJ) {
        continue
      }

      // Récupérer le parent de la TJ
      const getParentTJ = await models.TJ.findById(getTJ.parent_id)
      if (!getParentTJ) {
        continue
      }

      const getHRBackupOfParentTJ = await models.HRBackups.findById(getParentTJ.backup_id)
      if (!getHRBackupOfParentTJ) {
        continue
      }

      await models.HRBackups.updateById(backup.id, {
        stat_exclusion: true,
        group_id: getHRBackupOfParentTJ.group_id,
        group_id_rank: (await models.HRBackups.count({
          where: {
            group_id: getHRBackupOfParentTJ.group_id,
          },
        })) + 1,
      })
    }
  },
  down: (/*queryInterface, Sequelize*/) => { },
}
