module.exports = {
  up: async (queryInterface, Sequelize, models) => {
    const tj = await models.HRBackups.findOne({
      where: { label: 'TJ MULHOUSE' },
    })
    if (tj) {
      await tj.update({ jirs: false })
    }
  },
  down: (/*queryInterface , Sequelize*/) => {},
}
