import { maxBy, minBy } from 'lodash'
import { today } from '../../../utils/date'
import { filterActivitiesByDate, findSituation } from '../../../utils/humanServices'
import { getIdsIndispo } from '../../../utils/referentiel'

module.exports = {
  up: async (queryInterface, Sequelize, models) => {
    const list = await models.HumanResources.findAll({
      raw: true,
    })
    const getToday = today()
    const idsIndispo = getIdsIndispo(await models.ContentieuxReferentiels.getReferentiels())
    
    for (let i = 0; i < list.length; i++) {
      const hr = await models.HumanResources.getHr(list[i].id)
      const activities = (await models.HRVentilations.getActivitiesByHR(list[i].id, hr.dateEnd)).filter((a) => a.percent)
      let histories = []

      const max = maxBy(
        activities.filter((a) => a.dateStop),
        function (o) {
          const dateStop = new Date(o.dateStop)
          return dateStop.getTime()
        }
      )
      let maxDate =
      max && max.dateStop && max.dateStop.getTime() > getToday.getTime()
        ? today(new Date(max.dateStop))
        : new Date(today())
      let currentDateEnd = null
      if (hr && hr.dateEnd) {
        currentDateEnd = new Date(hr.dateEnd)
      }
      if (currentDateEnd && currentDateEnd.getTime() > maxDate.getTime()) {
        maxDate = currentDateEnd
      }

      const min = minBy(
        ([...activities, ...hr.situations]).filter(
          (a) => a.dateStart
        ),
        function (o) {
          const date = new Date(o.dateStart)
          return date.getTime()
        }
      )
      const minDate =
      min && min.dateStart ? today(new Date(min.dateStart)) : new Date(today())

      const currentDate = new Date(minDate)
      let idOfActivities = []
      while (currentDate.getTime() <= maxDate.getTime()) {
        let delta = []

        const findActivities = filterActivitiesByDate(
          activities,
          currentDate
        )
        const findSit = findSituation(
          hr,
          currentDate
        )
  
        delta = findActivities.map((f) => f.id)
        if (findSit) {
          delta.push(findSit.id)
        }
  
        if (JSON.stringify(idOfActivities) !== JSON.stringify(delta)) {
          idOfActivities = delta
          const indisp = findActivities.filter(
            (r) =>
              idsIndispo.indexOf(r.referentielId) !== -1
          )
          const dateStop = new Date(currentDate)
          let etp = (findSit && findSit.etp) || 0
  
          if(currentDateEnd && currentDateEnd.getTime() <= dateStop.getTime()) {
            etp = 0
          }
  
          // new list
          histories.push({
            ...findSit,
            etp,
            indisponibilities: indisp,
            activities: findActivities,
            dateStart: new Date(currentDate),
          })
        }
  
        currentDate.setDate(currentDate.getDate() + 1)
      }
  
      await models.HRSituations.syncSituations(histories, list[i].id, true)
    }
  },
  down: (/*queryInterface , Sequelize*/) => {},
}