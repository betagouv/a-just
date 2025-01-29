const { isCa } = require("../../../utils/ca")

module.exports = {
  up: async (queryInterface, Sequelize, models) => {
      const findFct = await models.HRFonctions.findOne({
        where: {
          code: "Att. J",
        },
      });

      if (findFct) {
        findFct.update({
          category_detail: 'C',
        })
      }
  },
  down: (/*queryInterface , Sequelize*/) => {},
}
