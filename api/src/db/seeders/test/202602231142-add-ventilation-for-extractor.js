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

        const contentieuxJAFId = await models.ContentieuxReferentiels.findOne({
            where: {
                label: "Contentieux JAF"
            }
        }).then((contentieux) => {
            if (contentieux) {
                return contentieux.dataValues.id
            }
            return null
        })

        const congeMaladieTypeId = await models.ContentieuxReferentiels.findOne({
            where: {
                label: "Congé maladie ordinaire"
            }
        }).then((contentieux) => {
            if (contentieux) {
                return contentieux.dataValues.id
            }
            return null
        })

        const tpsPartielTypeId = await models.ContentieuxReferentiels.findOne({
            where: {
                label: "Temps partiel thérapeutique"
            }
        }).then((contentieux) => {
            if (contentieux) {
                return contentieux.dataValues.id
            }
            return null
        })

        const action99TypeId = await models.ContentieuxReferentiels.findOne({
            where: {
                label: "Autres indisponibilités (action 99)"
            }
        }).then((contentieux) => {
            if (contentieux) {
                return contentieux.dataValues.id
            }
            return null
        })

        const CETTypeId = await models.ContentieuxReferentiels.findOne({
            where: {
                label: "Compte épargne temps"
            }
        }).then((contentieux) => {
            if (contentieux) {
                return contentieux.dataValues.id
            }
            return null
        })


        const agentToCreate = [
            {
                first_name: 'Extracteur',
                last_name: 'Basique',
                matricule: null,
                juridiction: 'TJ TEST',
                date_entree: new Date(2025, 0, 1),
                date_sortie: null,
                situations: [
                    {
                        etp: 1,
                        category_id: magistratCategoryId,
                        fonction_id: jugeFonctionId,
                        date_start: new Date(2025, 0, 1),
                        ventilations: [
                            {
                                nac_id: contentieuxProtectionId,
                                percent: 100,
                                date_start: new Date(2025, 0, 1),
                            }
                        ]
                    }
                ],

            },
            {
                first_name: 'Extracteur',
                last_name: 'Temps Partiel Simple',
                matricule: null,
                juridiction: 'TJ TEST',
                date_entree: new Date(2025, 0, 1),
                date_sortie: null,
                situations: [
                    {
                        etp: 0.8,
                        category_id: magistratCategoryId,
                        fonction_id: jugeFonctionId,
                        date_start: new Date(2025, 0, 1),
                        ventilations: [
                            {
                                nac_id: contentieuxProtectionId,
                                percent: 100,
                                date_start: new Date(2025, 0, 1),
                            }
                        ]
                    }
                ]
            },
            {
                first_name: 'Extracteur',
                last_name: 'Multi Ventilation',
                matricule: null,
                juridiction: 'TJ TEST',
                date_entree: new Date(2025, 0, 1),
                date_sortie: null,
                situations: [
                    {
                        etp: 1,
                        category_id: magistratCategoryId,
                        fonction_id: jugeFonctionId,
                        date_start: new Date(2025, 0, 1),
                        ventilations: [
                            {
                                nac_id: contentieuxProtectionId,
                                percent: 60,
                                date_start: new Date(2025, 0, 1),
                            },
                            {
                                nac_id: contentieuxJAFId,
                                percent: 40,
                                date_start: new Date(2025, 0, 1),
                            }
                        ]
                    },
                ]
            },
            {
                first_name: 'Extracteur',
                last_name: 'Absenteisme Simple',
                matricule: null,
                juridiction: 'TJ TEST',
                date_entree: new Date(2025, 0, 1),
                date_sortie: null,
                situations: [
                    {
                        etp: 1,
                        category_id: magistratCategoryId,
                        fonction_id: jugeFonctionId,
                        date_start: new Date(2025, 0, 1),
                        ventilations: [
                            {
                                nac_id: contentieuxProtectionId,
                                percent: 100,
                                date_start: new Date(2025, 0, 1),
                            },
                        ],
                        indispos: [
                            {
                                nac_id: congeMaladieTypeId,
                                percent: 15,
                                date_start: new Date(2025, 0, 1),
                            }
                        ]
                    },
                ]
            },
            {
                first_name: 'Extracteur',
                last_name: 'Action 99 Simple',
                matricule: null,
                juridiction: 'TJ TEST',
                date_entree: new Date(2025, 0, 1),
                date_sortie: null,
                situations: [
                    {
                        etp: 1,
                        category_id: magistratCategoryId,
                        fonction_id: jugeFonctionId,
                        date_start: new Date(2025, 0, 1),
                        ventilations: [
                            {
                                nac_id: contentieuxProtectionId,
                                percent: 100,
                                date_start: new Date(2025, 0, 1),
                            },
                        ],
                        indispos: [
                            {
                                nac_id: action99TypeId,
                                percent: 20,
                                date_start: new Date(2025, 0, 1),
                            }
                        ]
                    },
                ]
            },
            {
                first_name: 'Extracteur',
                last_name: 'Delegation TJ',
                matricule: null,
                juridiction: 'TJ TEST',
                date_entree: new Date(2025, 0, 1),
                date_sortie: null,
            },
            {
                first_name: 'Extracteur',
                last_name: 'CET > 30Jours',
                matricule: null,
                juridiction: 'TJ TEST',
                date_entree: new Date(2025, 0, 1),
                date_sortie: null,
                situations: [
                    {
                        etp: 1,
                        category_id: magistratCategoryId,
                        fonction_id: jugeFonctionId,
                        date_start: new Date(2025, 0, 1),
                        ventilations: [
                            {
                                nac_id: contentieuxProtectionId,
                                percent: 100,
                                date_start: new Date(2025, 0, 1),
                            },
                        ],
                        indispos: [
                            {
                                nac_id: CETTypeId,
                                percent: 15,
                                date_start: new Date(2025, 0, 1),
                            }
                        ]
                    },
                ]
            },
            {
                first_name: 'Extracteur',
                last_name: 'Multi Indispo Mixtes',
                matricule: null,
                juridiction: 'TJ TEST',
                date_entree: new Date(2025, 0, 1),
                date_sortie: null,
                situations: [
                    {
                        etp: 1,
                        category_id: magistratCategoryId,
                        fonction_id: jugeFonctionId,
                        date_start: new Date(2025, 0, 1),
                        ventilations: [
                            {
                                nac_id: contentieuxProtectionId,
                                percent: 100,
                                date_start: new Date(2025, 0, 1),
                            },
                        ],
                        indispos: [
                            {
                                nac_id: congeMaladieTypeId,
                                percent: 10,
                                date_start: new Date(2025, 0, 1),
                            },
                            {
                                nac_id: action99TypeId,
                                percent: 15,
                                date_start: new Date(2025, 0, 1),
                            }
                        ]
                    },
                ]
            },
            {
                first_name: 'Extracteur',
                last_name: 'Deux Situations',
                matricule: null,
                juridiction: 'TJ TEST',
                date_entree: new Date(2025, 0, 1),
                date_sortie: null,
            },
            {
                first_name: 'Extracteur',
                last_name: 'Indispo + Multi Ventilation',
                matricule: null,
                juridiction: 'TJ TEST',
                date_entree: new Date(2025, 0, 1),
                date_sortie: null,
                situations: [
                    {
                        etp: 1,
                        category_id: magistratCategoryId,
                        fonction_id: jugeFonctionId,
                        date_start: new Date(2025, 0, 1),
                        ventilations: [
                            {
                                nac_id: contentieuxProtectionId,
                                percent: 60,
                                date_start: new Date(2025, 0, 1),
                            },
                            {
                                nac_id: contentieuxJAFId,
                                percent: 40,
                                date_start: new Date(2025, 0, 1),
                            },
                        ],
                        indispos: [
                            {
                                nac_id: congeMaladieTypeId,
                                percent: 20,
                                date_start: new Date(2025, 0, 1),
                            }
                        ]
                    },
                ]
            },
            {
                first_name: 'Extracteur',
                last_name: 'IndispoSupETP',
                matricule: null,
                juridiction: 'TJ TEST',
                date_entree: new Date(2025, 0, 1),
                date_sortie: null,
                situations: [
                    {
                        etp: 0.8,
                        category_id: magistratCategoryId,
                        fonction_id: jugeFonctionId,
                        date_start: new Date(2025, 0, 1),
                        ventilations: [
                            {
                                nac_id: contentieuxProtectionId,
                                percent: 100,
                                date_start: new Date(2025, 0, 1),
                            },
                        ],
                        indispos: [
                            {
                                nac_id: congeMaladieTypeId,
                                percent: 60,
                                date_start: new Date(2025, 0, 1),
                            },
                            {
                                nac_id: tpsPartielTypeId,
                                percent: 30,
                                date_start: new Date(2025, 0, 1),
                            }
                        ]
                    },
                ]
            },
            {
                first_name: 'Extracteur',
                last_name: 'PeriodeSansActivite',
                matricule: null,
                juridiction: 'TJ TEST',
                date_entree: new Date(2025, 0, 1),
                date_sortie: null,
            }
        ]


        if (tj_test_id) {
            const createdAgents = []

            // Création des agents
            for (let i = 0; i < agentToCreate.length; i++) {
                const { situations = [], ...agentData } = agentToCreate[i]

                const agent = await models.HumanResources.create({
                    ...agentData,
                    backup_id: tj_test_id,
                })
                createdAgents.push(agent)
            }

            if (createdAgents.length > 0 && createdAgents.length === agentToCreate.length) {

                for (let i = 0; i < agentToCreate.length; i++) {

                    // Création des situations et ventilations et activités des agents créés
                    if (agentToCreate[i].situations) {
                        for (let j = 0; j < agentToCreate[i].situations.length; j++) {

                            const { ventilations, indispos, ...situaitonToCreate } = agentToCreate[i].situations[j]

                            const situatonId = await models.HRSituations.create({
                                human_id: createdAgents[i].id,
                                ...situaitonToCreate,
                            }).then((situation) => situation.dataValues.id)

                            if (agentToCreate[i].situations[j].ventilations) {
                                for (let k = 0; k < agentToCreate[i].situations[j].ventilations.length; k++) {

                                    // Création des ventilations
                                    await models.HRVentilations.create({
                                        rh_id: createdAgents[i].id,
                                        ...agentToCreate[i].situations[j].ventilations[k],
                                        backup_id: tj_test_id
                                    })

                                    // Création des activités liées à la ventilation
                                    await models.HRActivities.create({
                                        hr_situation_id: situatonId,
                                        nac_id: agentToCreate[i].situations[j].ventilations[k].nac_id,
                                        percent: agentToCreate[i].situations[j].ventilations[k].percent,
                                    })
                                }
                            }

                            if (agentToCreate[i].situations[j].indispos) {
                                for (let k = 0; k < agentToCreate[i].situations[j].indispos.length; k++) {

                                    // Création des indisponibilités
                                    await models.HRIndisponibilities.create({
                                        hr_id: createdAgents[i].id,
                                        ...agentToCreate[i].situations[j].indispos[k],
                                    })
                                }
                            }
                        }
                    }
                }
            }
        }
    },
    down: async (queryInterface, Sequelize, models) => {

    },
}