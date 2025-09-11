module.exports = {
  up: async (queryInterface, Sequelize, models) => {
    if (isTj()) {
      await models.HRFonctions.destroy({
        where: {},
        truncate: true,
        force: true,
      })

      const categories = [
        {
          label: 'PRÉSIDENT',
          code: 'P',
        },
        {
          label: 'PREMIER VICE-PRÉSIDENT',
          code: '1VP',
        },
        {
          label: 'PREMIER VICE-PRÉSIDENT CHARGÉ DES FONCTIONS DE JUGE DES CONTENTIEUX DE LA PROTECTION',
          code: '1VPCP',
        },
        {
          label: 'PREMIER VICE-PRÉSIDENT CHARGÉ DES FONCTIONS DE JUGE DES ENFANTS',
          code: '1VPE',
        },
        {
          label: "PREMIER VICE-PRÉSIDENT CHARGÉ DES FONCTIONS DE JUGE D'INSTRUCTION",
          code: '1VPI',
        },
        {
          label: "VICE-PRÉSIDENT CHARGÉ D'UN SECRÉTARIAT GÉNÉRAL",
          code: 'VPSG',
        },
        {
          label: "PREMIER VICE-PRÉSIDENT CHARGÉ DES FONCTIONS DE JUGE DE L'APPLICATION DES PEINES",
          code: '1VPAP',
        },
        {
          label: 'PREMIER VICE-PRÉSIDENT CHARGÉ DES FONCTIONS DE JUGE DES LIBERTÉS ET DE LA DÉTENTION',
          code: '1VPLD',
        },
        {
          label: 'PREMIER VICE-PRÉSIDENT ADJOINT',
          code: '1VPA',
        },
        {
          label: 'VICE-PRÉSIDENT',
          code: 'VP',
        },
        {
          label: 'VICE-PRÉSIDENT CHARGÉ DES FONCTIONS DE JUGE DES CONTENTIEUX DE LA PROTECTION',
          code: 'VPCP',
        },
        {
          label: 'VICE-PRÉSIDENT CHARGÉ DES FONCTIONS DE JUGE DES ENFANTS',
          code: 'VPE',
        },
        {
          label: "VICE-PRÉSIDENT CHARGÉ DES FONCTIONS DE JUGE D'INSTRUCTION",
          code: 'VPI',
        },
        {
          label: "VICE-PRÉSIDENT CHARGÉ DES FONCTIONS DE JUGE DE L'APPLICATION DES PEINES",
          code: 'VPAP',
        },
        {
          label: 'VICE-PRÉSIDENT CHARGÉ DES FONCTIONS DE JUGE DES LIBERTÉS ET DE LA DÉTENTION',
          code: 'VPLD',
        },
        {
          label: 'JUGE',
          code: 'J',
        },
        {
          label: 'JUGE DES CONTENTIEUX DE LA PROTECTION',
          code: 'JCP',
        },
        {
          label: 'JUGE DES ENFANTS',
          code: 'JE',
        },
        {
          label: "JUGE D'INSTRUCTION",
          code: 'JI',
        },
        {
          label: "JUGE D'APPLICATION DES PEINES",
          code: 'JAP',
        },
        {
          label: 'ASSISTANT SPÉCIALISÉ',
          code: 'AS',
        },
      ]

      for (let i = 0; i < categories.length; i++) {
        await models.HRFonctions.create({ ...categories[i], rank: i + 1 })
      }
    }
  },
  down: (/*queryInterface , Sequelize*/) => {},
}
