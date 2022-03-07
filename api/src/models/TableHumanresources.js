import slugify from 'slugify'
import { posad } from '../constants/hr'
import { ucFirst } from '../utils/utils'

const now = new Date()
const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())


export default (sequelizeInstance, Model) => {
  Model.getCurrentHr = async (backupId) => {
    const list = await Model.findAll({
      attributes: ['id', 'first_name', 'last_name', 'date_entree', 'date_sortie', 'backup_id', 'cover_url'],
      where: {
        backup_id: backupId,
      }, 
      include: [{
        attributes: ['id', 'comment'],
        model: Model.models.HRComments,
      }],
      raw: true,
    })

    for(let i = 0; i < list.length; i++) {
      list[i] = {
        id: list[i].id,
        firstName: list[i].first_name,
        lastName: list[i].last_name,
        dateStart: list[i].date_entree,
        dateEnd: list[i].date_sortie,
        coverUrl: list[i].cover_url, 
        comment: list[i]['HRComment.comment'],
        activities: await Model.models.HRVentilations.getActivitiesByHR(list[i].id, backupId, list[i].date_sortie),
        situations: await Model.models.HRSituations.getListByHumanId(list[i].id),
      }
    }

    return list
  }

  Model.importList = async (list, title, id) => {
    const referentielMapping = {}
    const backupId = !title ? id : await Model.models.HRBackups.createWithLabel(title, list[0].codejur || list[0].juridiction)

    // delete old base
    await Model.destroy({
      where: {
        backup_id: id,
      },
    })

    const referentielMappingList = await Model.models.ContentieuxReferentiels.cacheReferentielMap
    referentielMappingList.map(ref => {
      referentielMapping[slugify(ref.label).toLowerCase().replace(/'/g, '_').replace(/-/g, '_')] = ref.label
    })

    for(let i = 0; i < list.length; i++) {
      const HRFromList = list[i]
      const options = {
        first_name: '',
        last_name: '',
        date_entree: today,
        backup_id: backupId,
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

      // add ventilation
      const situation = {
        fonction_id: 1,
        category_id: 1,
        etp: 1,
        date_start: today,
      }

      // corps: 'MAG',
      const findCategory = await Model.models.HRCategories.findOne({
        where: {
          label: 'Magistrat',
        },
      })
      if(findCategory) {
        situation.category_id = findCategory.id
      }

      const findFonction = await Model.models.HRFonctions.findOne({
        where: {
          code: HRFromList.fonction,
        },
      })
      if(findFonction) {
        situation.fonction_id = findFonction.id
      }

      if(HRFromList.posad) {
        const posadNumber = parseInt(HRFromList.posad)
        if(!isNaN(posadNumber)) {
          situation.etp = posadNumber / 100
        } else {
          situation.etp = posad[HRFromList.posad.toLowerCase()] || 1 
        }
      }

      if(HRFromList["%_d'activite"]) {
        situation.etp = HRFromList["%_d'activite"]
      }

      // create
      await Model.models.HRSituations.create({
        ...situation,
        human_id: findHRToDB.dataValues.id,
      })
    }
  } 

  Model.haveAccess = async (HRId, userId) => {
    const hr = await Model.findOne({
      attributes: ['id'],
      where: { 
        id: HRId,
      },
      include: [{
        attributes: ['id'],
        model: Model.models.Juridictions,
        include: [{
          attributes: ['id'],
          model: Model.models.UserJuridictions,
          where: {
            user_id: userId,
          },
        }],
      }],
      raw: true,
    })

    return hr ? true : false
  }

  return Model
}