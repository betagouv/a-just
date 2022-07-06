import { posad } from '../constants/hr'

const now = new Date()
const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())


export default (sequelizeInstance, Model) => {
  Model.getCurrentHr = async (backupId) => {
    const list = await Model.findAll({
      attributes: ['id', 'first_name', 'last_name', 'date_entree', 'date_sortie', 'backup_id', 'cover_url', 'updated_at'],
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
        updatedAt: list[i].updated_at,
        backupId: list[i].backup_id,
        comment: list[i]['HRComment.comment'],
        situations: await Model.models.HRSituations.getListByHumanId(list[i].id),
        indisponibilities: await Model.models.HRIndisponibilities.getAllByHR(list[i].id),
      }
    }

    return list
  }

  Model.importList = async (list) => {
    const importSituation = []
    for(let i = 0; i < list.length; i++) {
      const backupId = await Model.models.HRBackups.findOrCreateLabel(list[i].arrdt)

      
      if(!list[i].hmatricule || list[i].hmatricule === '0') {
        list[i].hmatricule = (list[i].nom_usage || '') + (list[i].nom_marital || '') + (list[i].prenom || '')
      }

      let findHRToDB = await Model.findOne({
        where: {
          backup_id: backupId,
          registration_number: list[i].hmatricule,
        },
        logging: false,
      })


      if(!findHRToDB) {
        // prepare ventilation
        const situation = {
          fonction_id: null,
          category_id: null,
          etp: 1,
          date_start: today,
        }

        const findCategory = await Model.models.HRCategories.findOne({
          where: {
            label: list[i].statut,
          },
          logging: false,
        })
        if(findCategory) {
          situation.category_id = findCategory.id
        }

        const findFonction = await Model.models.HRFonctions.findOne({
          where: {
            code: list[i][list[i].statut === 'Magistrat' ? 'fonction' : 'categorie'],
          },
          logging: false,
        })
        if(findFonction) {
          situation.fonction_id = findFonction.id
        } else if(list[i].statut === 'Magistrat') {
          // dont save this profil
          importSituation.push(list[i].nom_usage + ' no add by fonction')
          continue
        }

        const etp = posad[list[i].posad.toLowerCase()]
        if(etp) {
          situation.etp = etp
        } else {
          // dont save this profil
          importSituation.push(list[i].nom_usage + ' no add by etp')
          continue
        }

        // prepare person
        const options = {
          first_name: list[i].prenom || '',
          last_name: (list[i].nom_usage || list[i].nom_marital) || '',
          backup_id: backupId,
          registration_number: list[i].hmatricule,
        }

        list[i].date_aff = list[i].date_aff.replace(/#/, '')
        const dateSplited = list[i].date_aff.split('/')
        if(dateSplited.length === 3) {
          options.date_entree = new Date(dateSplited[2], +dateSplited[1] - 1, dateSplited[0]) 
          situation.date_start = new Date(dateSplited[2], +dateSplited[1] - 1, dateSplited[0]) 
        }
        
        // create person
        findHRToDB = await Model.create(options)

        // create
        await Model.models.HRSituations.create({
          ...situation,
          human_id: findHRToDB.dataValues.id,
        })

        importSituation.push(list[i].nom_usage + ' ADDED')
      } else {
        importSituation.push(list[i].nom_usage + ' no add by exist')
      }
    }

    console.log(importSituation)
  } 

  Model.haveAccess = async (HRId, userId) => {
    const hr = await Model.findOne({
      attributes: ['id'],
      where: { 
        id: HRId,
      },
      include: [{
        attributes: ['id'],
        model: Model.models.HRBackups,
        include: [{
          attributes: ['id'],
          model: Model.models.UserVentilations,
          where: {
            user_id: userId,
          },
        }],
      }],
      raw: true,
    })

    return hr ? true : false
  }

  Model.updateHR = async (hr, backupId) => {
    const options = {
      first_name: hr.firstName || null,
      last_name: hr.lastName || null,
      date_entree: hr.dateStart || null,
      date_sortie: hr.dateEnd || null,
      backup_id: backupId,
      updated_at: new Date(),
    }

    if(hr.id && hr.id > 0) {
      // update
      await Model.updateById(hr.id, options)
    } else {
      // create
      const newHr = await Model.create(options)
      hr.id = newHr.dataValues.id
    }

    await Model.models.HRSituations.syncSituations(hr.situations || [], hr.id)
    await Model.models.HRBackups.updateById(backupId, { updated_at: new Date() })
    await Model.models.HRIndisponibilities.syncIndisponibilites(hr.indisponibilities || [], hr.id)

    return await Model.getHr(hr.id)
  }

  Model.getHr = async (hrId) => {
    const hr = await Model.findOne({
      attributes: ['id', 'first_name', 'last_name', 'date_entree', 'date_sortie', 'backup_id', 'cover_url', 'updated_at'],
      where: {
        id: hrId,
      }, 
      include: [{
        attributes: ['id', 'comment'],
        model: Model.models.HRComments,
      }],
      raw: true,
    })

    if(hr) {
      return {
        id: hr.id,
        firstName: hr.first_name,
        lastName: hr.last_name,
        dateStart: hr.date_entree,
        dateEnd: hr.date_sortie,
        coverUrl: hr.cover_url, 
        updatedAt: hr.updated_at,
        comment: hr['HRComment.comment'],
        backupId: hr.backupId,
        situations: await Model.models.HRSituations.getListByHumanId(hr.id),
        indisponibilities: await Model.models.HRIndisponibilities.getAllByHR(hr.id),
      }
    }

    return hr
  }

  Model.removeHR = async (hrId) => {
    const hrFromDB = await Model.findOne({ 
      where: {
        id: hrId,
      },
      raw: true,
    })
    if(hrFromDB) {
      // control if have existing situations
      const situations = await Model.models.HRSituations.getListByHumanId(hrId)
      if(situations.length) {
        return false
      }

      await Model.models.HRBackups.updateById(hrFromDB.backup_id, { updated_at: new Date() })
    } else {
      return false
    }

    await Model.destroy({
      where: {
        id: hrId,
      },
    })

    // delete force all references
    await Model.models.HRVentilations.destroy({
      where: {
        rh_id: hrId,
      },
      force: true,
    })

    // delete force all situations
    await Model.models.HRSituations.destroy({
      where: {
        human_id: hrId,
      },
      force: true,
    })

    return true
  }

  return Model
}