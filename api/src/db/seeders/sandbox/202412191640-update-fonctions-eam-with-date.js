module.exports = {
  up: async (queryInterface, Sequelize, models) => {
    const findFunction = await models.HRFonctions.findOne({
      where: {
        label: "ATTACHÉ DE JUSTICE",
      },
    });
    if (findFunction) {
      await findFunction.update({
        min_date_avalaible: new Date(2025, 0, 1, 10),
      });
    }
  },
  down: (/*queryInterface , Sequelize*/) => {},
};
