import { sortBy } from 'lodash'
import { Op } from 'sequelize'

export default (sequelizeInstance, Model) => {
  Model.getCurrentHr = async () => {
    const list = await Model.findAll({
      attributes: ['id', 'first_name', 'last_name', 'etp', 'date_entree', 'date_sortie', 'note', 'enable'],
      include: [{
        attributes: ['id', 'rank', 'code', 'label'],
        model: Model.models.HRCategories,
      }, {
        attributes: ['id', 'rank', 'label'],
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
        enable: list[i].enable,
        category: {
          id: list[i]['HRCategory.id'],
          rank: list[i]['HRCategory.rank'],
          code: list[i]['HRCategory.code'],
          label: list[i]['HRCategory.label'],
        },
        fonction: {
          id: list[i]['HRFonction.id'],
          rank: list[i]['HRFonction.rank'],
          label: list[i]['HRFonction.label'],
        },
        activities: await Model.models.HRVentilations.getActivitiesByHR(list[i].id),
      }
    }

    return sortBy(list, ['fonction.rank', 'category.rank', 'firstName', 'lastName'])
  }

  Model.importList = async (list) => {
    const idList = []
    const referentielMapping = {
      'civil_non-specialise': 'Civil Non Spécialisé',
      'contentieux_jaf': 'Contentieux JAF',
      'contentieux_social': 'Contentieux Social',
      'jld_civil': 'JLC civil',
      'juges_des_enfants': 'JDE',
      'penal': 'Pénal',
      'soutien': 'Soutien',
    }

    const getContentieuxId = async (label) => {
      label = label.replace(/_/, ' ')
      const listCont = await Model.models.ContentieuxReferentiels.findAll({
        attributes: ['id', 'niveau_3', 'niveau_4'],
        where: {
          niveau_3: label,
        },
        order: ['niveau_3', 'niveau_4'],
        raw: true,
      })

      console.log(label, listCont)
      return listCont.length ? listCont[0].id : null
    }


    for(let i = 0; i < list.length; i++) {
      const HRFromList = list[i]
      let findHRToDB = await Model.findOne({
        where: {
          registration_number: HRFromList.num_fonc,
        },
      })
      const options = {
        enable: false,
        juridiction_id: 1,
        hr_fonction_id: 1,
        hr_categorie_id: 1,
        etp: 1,
        first_name: '',
        last_name: '',
      }
      if(HRFromList.num_statut && HRFromList.num_statut === '1.0') {
        options.enable = true
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
      const findFonction = await Model.models.HRFonctions.findOne({
        where: {
          label: 'Magistrat',
        },
      })
      if(findFonction) {
        options.hr_fonction_id = findFonction.id
      }

      const findCategory = await Model.models.HRCategories.findOne({
        where: {
          code: HRFromList.fonction,
        },
      })
      if(findCategory) {
        options.hr_categorie_id = findCategory.id
      }

      if(HRFromList.etp_t) {
        options.etp = parseFloat(HRFromList.etp_t) 
      }

      if(HRFromList.nom_affichage) {
        const splitName = HRFromList.nom_affichage.split(' ')
        options.first_name = splitName[0]
        options.last_name = splitName[1]
      }

      // date_affectation: '#20/07/2012',
      // date_posad: '#15/09/2017',
      // retire_du_temps_de_travail: '0.0',

      if(!findHRToDB) {
        // create
        findHRToDB = await Model.create({
          registration_number: HRFromList.num_fonc,
          ...options,
        })

        // stop all ventilations
        await Model.models.HRVentilations.update({
          date_stop: new Date(),
        }, {
          where: {
            rh_id: findHRToDB.dataValues.id,
          },
        })
      } else {
        // update
        findHRToDB = await findHRToDB.update(options)
      }
      // memorize id list
      idList.push(findHRToDB.dataValues.id)

      const objectList = Object.entries(HRFromList)
      for(let x = 0; x < objectList.length; x++) {
        const [key, value] = objectList[x]
        if(referentielMapping[key]) {
          const contentieuxId = await getContentieuxId(referentielMapping[key])
          const percent = parseFloat(value)
          if(key && percent && contentieuxId) {
            await Model.models.HRVentilations.create({
              rh_id: findHRToDB.dataValues.id,
              nac_id: contentieuxId,
              percent,
              date_start: new Date(),
            })        
          }
        }
      }
    }

    
    // all other HR move to "enable" = false
    await Model.update({
      enable: false,
    }, {
      where: {
        id: { [Op.notIn]: idList },
      },
    })
  } 

  return Model
}