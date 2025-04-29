module.exports = {
  up: async (queryInterface, Sequelize, models) => {
    const idsToExclude = [
      1, 2, 3, 4, 5, 6, 7, 8, 9, 11, 12, 13, 14, 15, 17, 18, 19, 25, 103, 112,
      122, 124, 142, 171, 175, 181, 188, 189, 202, 204, 206, 207, 208, 209, 210,
    ];
    idsToExclude.map(async (x) => {
      const juridiction = await models.HRBackups.findOne({
        where: {
          id: x,
        },
      });

      if (juridiction) await juridiction.update({ stat_exclusion: true });
    });
  },
  down: (/*queryInterface , Sequelize*/) => {},
};
