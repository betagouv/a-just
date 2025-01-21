const { isCa } = require("../../../utils/ca");

module.exports = {
  up: async (queryInterface, Sequelize, models) => {
    if (isCa()) {
      await models.HRFonctions.create({
        code: "CHCAB",
        label: "CHEF DE CABINET",
        rank: 2,
        category_detail: "F-TIT",
        category_id: 2,
        calculatrice_is_active: true,
        position: "Titulaire",
      });
    }
  },
  down: (/*queryInterface , Sequelize*/) => {},
};
