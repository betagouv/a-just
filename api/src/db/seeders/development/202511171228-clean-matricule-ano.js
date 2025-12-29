const { isTj } = require('../../../utils/ca')

module.exports = {
  up: async (queryInterface, Sequelize, models) => {
    const labels = isTj()
      ? ['TJ DE DEMO BIS', 'TJ BASE TEST','TEST15OCT', 'TJ DE DEMO', 'TJ RECETTE', 'TJ WEBINAIRE']
      : ['CA BASE TEST', 'CA DE DEMO', 'CA de Lyon - 2025 recette', 'CA RECETTE', 'CA WEBINAIRE']

    for (const label of labels) {
      const t = await queryInterface.sequelize.transaction()
      try {
        const backup = await models.HRBackups.findOne({ where: { label } })
        if (!backup) {
          console.warn(`Aucun HRBackup trouvé avec label='${label}'. On passe au suivant.`)
          await t.rollback()
          continue
        }

        const backupId = backup.id

        const countRes = await queryInterface.sequelize.query(
          `SELECT count(*)::int AS cnt FROM "HumanResources" WHERE backup_id = :backupId AND matricule != ''`,
          { replacements: { backupId }, type: queryInterface.sequelize.QueryTypes.SELECT, transaction: t },
        )
        const count = Array.isArray(countRes) && countRes.length ? countRes[0].cnt : 0
        console.log(`Agents à anonymiser pour '${label}' (backupId=${backupId}) : ${count}`)

        if (count === 0) {
          await t.rollback()
          continue
        }

        await queryInterface.sequelize.query(
          `UPDATE "HumanResources" SET matricule = NULL WHERE backup_id = :backupId AND matricule != ''`,
          { replacements: { backupId }, transaction: t },
        )

        await t.commit()
        console.log(`Anonymisation terminée pour '${label}'.`)
      } catch (err) {
        await t.rollback()
        console.error(`Erreur lors de l'anonymisation pour label='${label}' :`, err)
        throw err
      }
    }
  },
  down: (/*queryInterface , Sequelize*/) => {},
}
