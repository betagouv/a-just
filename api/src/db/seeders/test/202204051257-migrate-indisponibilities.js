import { getIdsIndispo } from '../../../utils/referentiel'

module.exports = {
  up: async (queryInterface, Sequelize, models) => {
    const list = await models.HumanResources.findAll({
      raw: true,
    })
    const idsIndispo = getIdsIndispo(await models.ContentieuxReferentiels.getReferentiels())

    for (let i = 0; i < list.length; i++) {
      const indisponibilities = (await models.HRVentilations.findAll({
        attributes: ['rh_id', 'nac_id', 'percent', 'date_start', 'date_stop'],
        where: {
          rh_id: list[i].id,
          nac_id: idsIndispo,
        },
        raw: true,
      })).map(indisp => ({
        ...indisp,
        contentieux: {
          id: indisp.nac_id,
        },
        dateStart: indisp.date_start,
        dateStop: indisp.date_stop,
      }))

      if(indisponibilities.length) {
        await models.HRIndisponibilities.syncIndisponibilites(indisponibilities, list[i].id)
      }
    }
  },
  down: (/*queryInterface , Sequelize*/) => {},
}