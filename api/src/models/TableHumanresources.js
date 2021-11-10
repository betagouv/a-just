import { sortBy } from 'lodash'
import slugify from 'slugify'
import { posad } from '../constants/hr'

const now = new Date()
const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())


export default (sequelizeInstance, Model) => {
  Model.getCurrentHr = async (backupId) => {
    if(!backupId) {
      backupId = await Model.models.HRBackups.lastId()
    }

    const list = await Model.findAll({
      attributes: ['id', 'first_name', 'last_name', 'etp', 'date_entree', 'date_sortie', 'note', 'backup_id'],
      where: {
        backup_id: backupId,
      }, 
      include: [{
        attributes: ['id', 'rank', 'label'],
        model: Model.models.HRCategories,
      }, {
        attributes: ['id', 'rank', 'code', 'label'],
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
        dateStart: list[i].date_entree,
        dateEnd: list[i].date_sortie,
        note: list[i].note,
        category: {
          id: list[i]['HRCategory.id'],
          rank: list[i]['HRCategory.rank'],
          code: list[i]['HRCategory.code'],
          label: list[i]['HRCategory.label'],
        },
        fonction: {
          id: list[i]['HRFonction.id'],
          rank: list[i]['HRFonction.rank'],
          code: list[i]['HRFonction.code'],
          label: list[i]['HRFonction.label'],
        },
        activities: await Model.models.HRVentilations.getActivitiesByHR(list[i].id, backupId),
      }
    }

    return sortBy(list, ['fonction.rank', 'category.rank', 'firstName', 'lastName'])
  }

  Model.importList = async (list, title) => {
    const referentielMapping = {}
    const backupId = await Model.models.HRBackups.createWithLabel(title)

    const referentielMappingList = await Model.models.ContentieuxReferentiels.getMainTitles()
    referentielMappingList.map(ref => {
      referentielMapping[slugify(ref.label).toLowerCase().replace(/'/g, '_').replace(/-/g, '_')] = ref.label
    })

    for(let i = 0; i < list.length; i++) {
      const HRFromList = list[i]
      const options = {
        juridiction_id: 1,
        hr_fonction_id: 1,
        hr_categorie_id: 1,
        etp: 1,
        first_name: '',
        last_name: '',
        date_entree: today,
        backup_id: backupId,
      }

      const findJuridiction = await Model.models.Juridictions.findOne({
        where: {
          cour_appel: HRFromList.codejur,
        },
      })
      if(findJuridiction) {
        options.juridiction_id = findJuridiction.id
      }

      // corps: 'MAG',
      const findCategory = await Model.models.HRCategories.findOne({
        where: {
          label: 'Magistrat',
        },
      })
      if(findCategory) {
        options.hr_category_id = findCategory.id
      }

      const findFonction = await Model.models.HRFonctions.findOne({
        where: {
          code: HRFromList.fonction,
        },
      })
      if(findFonction) {
        options.hr_fonction_id = findFonction.id
      }

      if(HRFromList.posad) {
        options.etp = posad[HRFromList.posad.toLowerCase()] || 1 
      }

      if(HRFromList.nom_affichage) {
        const splitName = HRFromList.nom_affichage.split(' ')
        options.first_name = splitName[0]
        options.last_name = splitName[1]
      }

      if(HRFromList.date_affectation) {
        HRFromList.date_affectation = HRFromList.date_affectation.replace(/#/, '')
        const dateSplited = HRFromList.date_affectation.split('/')
        if(dateSplited.length === 3) {
          options.date_entree = new Date(dateSplited[2], +dateSplited[1] - 1, dateSplited[0]) 
        }
      }

      // retire_du_temps_de_travail: '0.0', TODO a voir apres appel de lyon

      // create
      const findHRToDB = await Model.create({
        registration_number: HRFromList.num_fonc,
        ...options,
      })

      // add ventilations
      const objectList = Object.entries(HRFromList)
      for(let x = 0; x < objectList.length; x++) {
        let [key, value] = objectList[x]
        if(referentielMapping[key]) {
          const contentieuxId = await Model.models.ContentieuxReferentiels.getContentieuxId(referentielMapping[key])
          const percent = parseFloat(value)
          if(key && percent && contentieuxId) {
            await Model.models.HRVentilations.create({
              rh_id: findHRToDB.dataValues.id,
              nac_id: contentieuxId,
              percent,
              date_start: today,
              backup_id: backupId,
            })        
          }
        }
      }
    }
  } 

  return Model
}