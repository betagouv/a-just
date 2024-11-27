import sequelize from 'sequelize'
import { CODES } from '../constants/log-codes'

/**
 * Logs tracés pour historiser différents évents
 */

export default (sequelizeInstance, Model) => {
  /**
   * Ajout d'une ligne un events
   * @param {*} codeId
   * @param {*} userId
   * @param {*} datas
   */
  Model.addLog = async (codeId, userId, datas = {}, options = { formatValue: true, datas2: null, logging: true }) => {
    const currentLogging = sequelize.options.logging

    if (options && options.logging === false) {
      sequelize.options.logging = false
    } else {
      console.log(codeId, userId, datas)
    }

    await Model.create({
      code_id: codeId,
      user_id: userId,
      datas: options.formatValue ? JSON.stringify(datas) : datas,
      datas2: options?.datas2 || null,
    })

    if (options && options.logging === false) {
      sequelize.options.logging = currentLogging
    }
  }

  /**
   * Liste des tous les events et qui l'a fait
   * @returns
   */
  Model.getLogs = async (where = {}) => {
    const list = await Model.findAll({
      order: [['created_at', 'DESC']],
      raw: true,
      where,
      include: [
        {
          model: Model.models.Users,
        },
      ],
    })

    return list.map((l) => ({
      id: l.id,
      codeId: l.code_id,
      date: l.created_at,
      datas: l.datas,
      user:
        l['User.id'] === null
          ? null
          : {
            email: l['User.email'],
            firstName: l['User.first_name'],
            lastName: l['User.last_name'],
          },
    }))
  }

  /** Converti liste logs en csv pour export */
  Model.getCsvLogs = async () => {
    const list = await Model.getLogs()

    return (
      '"id";"codeId";"label";"ower";"date";\n' +
      list
        .map((l) => {
          return `"${l.id}";"${l.codeId}";"${Model.formatLabel(l)}";"${l.user ? l.user.firstName + ' ' + l.user.lastName + ' ' + l.user.email : 'null'}";"${
            l.date
          }";`
        })
        .join('\n')
    )
  }

  /**
   * Conversion d'un code + variable en variable traduit
   * @param {*} line
   * @returns
   */
  Model.formatLabel = (line) => {
    const datas = JSON.parse(line.datas || '')
    const regex = /\${(.*?)}/g

    let stringToReturn = CODES[line.codeId] || ''
    const tab = stringToReturn.match(regex) || []

    tab.map((find) => {
      const key = find.slice(2, -1)
      if (datas[key]) {
        stringToReturn = stringToReturn.replace(find, datas[key])
      }
    })

    return stringToReturn
  }

  /**
   * Retourne la dernière log qui correspond à l'utilisateur et le code log
   * @param {*} userId
   * @param {*} codeId
   * @param {*} params
   */
  Model.findLastLog = async (userId, codeId, params) => {
    const findOne = await Model.findOne({
      where: {
        user_id: userId,
        code_id: codeId,
        datas: JSON.stringify(params),
      },
      order: [['updated_at', 'desc']],
      raw: true,
    })

    return findOne
  }

  return Model
}
