import { isCa } from "../../../utils/ca";

module.exports = {
  up: async (queryInterface, Sequelize, models) => {
    if (isCa()) {}
    
  },
  down: (/*queryInterface , Sequelize*/) => {},
};
