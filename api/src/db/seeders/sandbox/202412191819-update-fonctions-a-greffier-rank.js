module.exports = {
  up: async (queryInterface, Sequelize, models) => {
    const findFunction = await models.HRFonctions.findOne({
      where: {
        label: "A GREFFIER",
      },
    });
    const findFunctionChef = await models.HRFonctions.findOne({
      where: {
        label: "CHEF DE CABINET",
      },
      raw: true,
    });
    if (findFunction && findFunctionChef) {
      await findFunction.update({
        rank: findFunctionChef.rank,
      });
    }
  },
  down: (/*queryInterface , Sequelize*/) => {},
};
