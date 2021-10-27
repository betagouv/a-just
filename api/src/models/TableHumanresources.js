import { sortBy } from 'lodash'

export default (sequelizeInstance, Model) => {
  Model.getCurrentHr = async () => {
    const list = await Model.findAll({
      attributes: ['id', 'first_name', 'last_name', 'etp'],
      where: {
        enable: true,
      },
      include: [{
        attributes: ['rank', 'code', 'label'],
        model: Model.models.HRCategories,
      }, {
        attributes: ['rank', 'label'],
        model: Model.models.HRFonctions,
      }],
      raw: true,
    })

    for(let i = 0; i < list.length; i++) {
      list[i] = {
        id: list[i].id,
        etp: list[i].etp,
        firstName: list[i].first_name,
        lastName: list[i].last_name,
        category: {
          rank: list[i]['HRCategory.rank'],
          code: list[i]['HRCategory.code'],
          label: list[i]['HRCategory.label'],
        },
        fonction: {
          rank: list[i]['HRFonction.rank'],
          label: list[i]['HRFonction.label'],
        },
        activities: await Model.models.HRVentilations.getActivitiesByHR(list[i].id),
      }
    }

    return sortBy(list, ['fonction.rank', 'category.rank', 'firstName', 'lastName'])
  }

  return Model
}