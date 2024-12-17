import { isCa } from "../../../utils/ca";

module.exports = {
  up: async (queryInterface, Sequelize, models) => {
    if (isCa()) {
    
      const findSixUn = await models.ContentieuxReferentiels.findOne({
        where: {
          code_import: "6.1.",
        },
      });

      if (findSixUn) {
        await findSixUn.update({
          code_import: "12.7.",
        });
      }

      const findSixDeux = await models.ContentieuxReferentiels.findOne({
        where: {
          code_import: "6.2.",
        },
      });

      if (findSixDeux) {
        await findSixUn.update({
          code_import: "12.8.",
        });
      }

      const findSixQuatre = await models.ContentieuxReferentiels.findOne({
        where: {
          code_import: "6.4.",
        },
      });

      if (findSixQuatre) {
        await findSixUn.update({
          code_import: "12.9.",
        });
      }

      const findTroisQuatre = await models.ContentieuxReferentiels.findOne({
        where: {
          code_import: "3.4.",
        },
      });

      if (findTroisQuatre) {
        await findSixUn.update({
          code_import: "4.7.",
        });
      }
    }

  },
  down: (/*queryInterface , Sequelize*/) => {},
};
