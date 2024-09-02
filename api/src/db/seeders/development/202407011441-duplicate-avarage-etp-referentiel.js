module.exports = {
  up: async (queryInterface, Sequelize, models) => {
    //récuperer toutes les liaisons référentiels/juridictions
    const allReferentiels = await models.OptionsBackupJuridictions.findAll({
      where: {},
    })

    for (let i = 0; i < allReferentiels.length; i++) {
      const backup = await models.OptionsBackups.findOne({
        where: {
          id: allReferentiels[i].option_backup_id,
        },
        raw: true,
      })


      if (backup) {
        delete backup.id
        const backupCreated = await models.OptionsBackups.create({ ...backup, label: backup.label + ' - GREFFE', type: "GREFFE", status: 'Local' }) // ajouter attribue GREFFE
        const newBackupId = backupCreated.dataValues.id

        console.log('&=>', newBackupId)
        const hrList = await models.ContentieuxOptions.findAll({
          where: {
            backup_id: allReferentiels[i].option_backup_id,
          },
          raw: true,
        })

        let nbOfGreffeValues = 0
        for (let x = 0; x < hrList.length; x++) {
          if (hrList[x].average_processing_time_fonc) {
            nbOfGreffeValues++
            await models.ContentieuxOptions.create({
              contentieux_id: hrList[x].contentieux_id,
              average_processing_time_fonc: null,
              average_processing_time: hrList[x].average_processing_time_fonc,
              backup_id: newBackupId,
            })
          }

          await models.ContentieuxOptions.update(
            { average_processing_time_fonc: null },
            {
              where: {
                id: hrList[x].id,
              }
            }
          )
        }


        if (nbOfGreffeValues == 0)
          await models.OptionsBackups.destroy({
            where: {
              id: newBackupId
            },
            force: true,
          })
        else
          await models.OptionsBackupJuridictions.create({
            option_backup_id: newBackupId,
            juridiction_id: allReferentiels[i].juridiction_id,
          })


        await models.OptionsBackups.update(
          { type: "SIEGE", status: 'Local' },
          {
            where: {
              id: allReferentiels[i].option_backup_id,
            }
          }
        )
      }
    }
  },
  down: (/*queryInterface , Sequelize*/) => { },
}