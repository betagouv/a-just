import { GITBOOK_DATA_URL } from "../../../constants/gitbook-url"

module.exports = {
    up: async (queryInterface, Sequelize, models) => {
      GITBOOK_DATA_URL.map(async elem => {
        const ref = await models.ContentieuxReferentiels.findOne({
          where : {
            code_import : elem.code_import
          }
        })
        if (ref) {
          await models.ContentieuxReferentiels.update(
            { help_url: elem.help_url },
            { where: { id: ref.id } }
        );
        }
      
      })
    },
    down: (/*queryInterface , Sequelize*/) => { },
}