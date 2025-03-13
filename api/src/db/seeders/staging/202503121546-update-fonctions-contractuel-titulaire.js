module.exports = {
  up: async (queryInterface, Sequelize, models) => {
    const findFct1 = await models.HRFonctions.findOne({
      where: {
        label: "CONTRACTUEL A JUSTICE DE PROXIMITE",
        category_id: 3,
      },
    });
    if (findFct1) await findFct1.update({ position: "Contractuel" });
    const findFct2 = await models.HRFonctions.findOne({
      where: {
        label: "A GREFFIER",
        category_id: 2,
      },
    });
    if (findFct2) await findFct2.update({ position: "Titulaire" });
  },
  down: (/*queryInterface , Sequelize*/) => {},
};
