module.exports = {
  up: async (queryInterface, Sequelize, models) => {
    const refRelegationTJ = await models.ContentieuxReferentiels.findOne({
      where: {
        code_import: "14.13.",
      },
    });

    if (refRelegationTJ) {
      await refRelegationTJ.update({
        check_ventilation: false,
      });
    }
  },
  down: (/*queryInterface , Sequelize*/) => {},
};
