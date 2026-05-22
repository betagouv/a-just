const { mode } = require("crypto-js")

module.exports = {
    up: async (queryInterface, Sequelize, models) => {

        const tj_test_id = await models.HRBackups.findOne({
            where: {
                label: "TJ TEST"
            }
        }).then((backup) => {
            if (backup) {
                return backup.dataValues.id
            }
            return null
        })

        const magistratCategoryId = await models.HRCategories.findOne({
            where: {
                label: "Magistrat"
            }
        }).then((category) => {
            if (category) {
                return category.dataValues.id
            }
            return null
        })

        const jugeFonctionId = await models.HRFonctions.findOne({
            where: {
                label: "JUGE"
            }
        }).then((fonction) => {
            if (fonction) {
                return fonction.dataValues.id
            }
            return null
        })

        const contentieuxProtectionId = await models.ContentieuxReferentiels.findOne({
            where: {
                label: "Contentieux de la Protection"
            }
        }).then((contentieux) => {
            if (contentieux) {
                return contentieux.dataValues.id
            }
            return null
        })

        const agentToCreate =
        {
            first_name: 'Extracteur',
            last_name: 'No-Activity-Period',
            matricule: null,
            juridiction: 'TJ TEST',
            date_entree: new Date(2025, 2, 15),
            date_sortie: null,
            situations: [
                {
                    etp: 1,
                    category_id: magistratCategoryId,
                    fonction_id: jugeFonctionId,
                    date_start: new Date(2025, 4, 1),
                    ventilations: [
                        {
                            nac_id: contentieuxProtectionId,
                            percent: 100,
                            date_start: new Date(2025, 4, 1),
                        }
                    ]
                }
            ],
        }


        if (tj_test_id) {

            const { situations = [], ...agentData } = agentToCreate

            const agent = await models.HumanResources.create({
                ...agentData,
                backup_id: tj_test_id,
            })

            // Création des situations et ventilations et activités de l'agent créé
            if (agentToCreate.situations && agentToCreate.situations.length > 0) {
                const { ventilations, indispos, ...situaitonToCreate } = agentToCreate.situations[0]

                const situatonId = await models.HRSituations.create({
                    human_id: agent.id,
                    ...situaitonToCreate,
                }).then((situation) => situation.dataValues.id)

                if (agentToCreate.situations[0].ventilations) {
                    // Création de la ventilation
                    await models.HRVentilations.create({
                        rh_id: agent.id,
                        ...agentToCreate.situations[0].ventilations[0],
                        backup_id: tj_test_id
                    })

                    // Création des activités liées à la ventilation
                    await models.HRActivities.create({
                        hr_situation_id: situatonId,
                        nac_id: agentToCreate.situations[0].ventilations[0].nac_id,
                        percent: agentToCreate.situations[0].ventilations[0].percent,
                    })
                }
            }
        }
    },
    down: async (queryInterface, Sequelize, models) => {

    },
}