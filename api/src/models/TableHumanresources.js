import { sortBy } from 'lodash'
import slugify from 'slugify'
import { posad } from '../constants/hr'
import { ucFirst } from '../utils/utils'

const now = new Date()
const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())


export default (sequelizeInstance, Model) => {
  Model.getCurrentHr = async (backupId) => {
    const list = await Model.findAll({
      attributes: ['id', 'first_name', 'last_name', 'etp', 'posad', 'date_entree', 'date_sortie', 'note', 'backup_id', 'cover_url'],
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
        posad: list[i].posad,
        firstName: list[i].first_name,
        lastName: list[i].last_name,
        dateStart: list[i].date_entree,
        dateEnd: list[i].date_sortie,
        note: list[i].note,
        coverUrl: list[i].cover_url, 
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
    const backupId = await Model.models.HRBackups.createWithLabel(title, list[0].codejur)

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

      if(HRFromList.etp_t) {
        options.etp = parseFloat(HRFromList.etp_t)
      }

      if(HRFromList.posad) {
        options.posad = posad[HRFromList.posad.toLowerCase()] || 1 
      }

      if(HRFromList.prenom && HRFromList.prenom) {
        options.first_name = ucFirst(HRFromList.prenom)
        options.last_name = ucFirst(HRFromList.nom)
        if(HRFromList.nom_marital) {
          options.last_name += ' ep. ' + ucFirst(HRFromList.nom_marital)
        }
      } else if(HRFromList.nom_affichage) {        
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

      // create
      const findHRToDB = await Model.create({
        registration_number: HRFromList.num_fonc,
        ...options,
      })

      // add ventilations
      const objectList = Object.entries(HRFromList)
      for(let x = 0; x < objectList.length; x++) {
        let [key, value] = objectList[x]
        key = key.replace(/'/g, '_')
        if(referentielMapping[key]) {
          const contentieuxId = await Model.models.ContentieuxReferentiels.getContentieuxId(referentielMapping[key])
          const percent = Math.floor(parseFloat(value) * 100) / 100
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