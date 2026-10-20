module.exports = {
  up: async (queryInterface) => {
    await queryInterface.sequelize.query(`
      ALTER TABLE "ContentieuxReferentiels"
      ADD COLUMN IF NOT EXISTS "visible_in" character varying(32)[] NOT NULL DEFAULT ARRAY['everywhere']::character varying[];
    `)
  },
  down: async (/*queryInterface /*, Sequelize*/) => {
    return
  },
}
