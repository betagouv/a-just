const { isTj } = require('../../../utils/ca')

module.exports = {
  up: async (queryInterface, Sequelize, models) => {
    if (isTj()) {
      const fct = {
        Label: 'CHEF DE CABINET',
        Code: 'CHCAB',
        Rank: '1',
        'Category ID': '3',
        'Fonction onglet aggregat Category Detail': 'C',
        'Calculatrice Is Active': 'VRAI',
        Position: 'Contractuel',
        'Recoded Function': 'Fonctionnaire A-B-CBUR',
      }

      await models.HRFonctions.create({
        recoded_function: fct['Recoded Function'],
        position: fct.Position,
        code: fct.Code,
        label: fct.Label,
        category_id: fct['Category ID'],
        rank: Number(fct.Rank),
        category_detail: fct['Fonction onglet aggregat Category Detail'],
        calculatrice_is_active: Boolean(fct['Calculatrice Is Active'] === 'FAUX' ? 0 : 1),
      })
    }
  },
  down: (/*queryInterface , Sequelize*/) => {},
}
