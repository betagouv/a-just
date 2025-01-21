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

    const findFunction2 = await models.HRFonctions.findOne({
      where: {
        label: "ATTACHÉ DE JUSTICE",
      },
    });
    const findFunctionChef2 = await models.HRFonctions.findOne({
      where: {
        label: "ASSISTANT DE JUSTICE",
      },
      raw: true,
    });
    if (findFunction2 && findFunctionChef2) {
      await findFunction2.update({
        rank: findFunctionChef2.rank,
      });
    }
  },
  down: (/*queryInterface , Sequelize*/) => {},
};
