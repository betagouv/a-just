import { CODES } from '../constants/log-codes'

export default (sequelizeInstance, Model) => {
  Model.addLog = async (codeId, userId, datas = {}) => {
    await Model.create({
      code_id: codeId,
      user_id: userId,
      datas: JSON.stringify(datas),
    })
  }

  Model.getLogs = async () => {
    const list = await Model.findAll({
      order: [['created_at', 'DESC']],
      raw: true,
      include: [{
        model: Model.models.Users,
      }],
    })

    return list.map(l => ({
      id: l.id,
      codeId: l.code_id,
      date: l.created_at,
      datas: l.datas,
      user: l['User.id'] === null ? null : {
        email: l['User.email'],
        firstName: l['User.first_name'],
        lastName: l['User.last_name'],
      },
    }))
  }

  Model.getCsvLogs = async () => {
    const list = await Model.getLogs()

    return '"id";"codeId";"label";"ower";"date";\n' + list.map(l => {
      return `"${l.id}";"${l.codeId}";"${Model.formatLabel(l)}";"${l.user ? l.user.firstName + ' ' + l.user.lastName + ' ' + l.user.email : 'null'}";"${l.date}";`
    }).join('\n')
  }

  Model.formatLabel = (line) => {
    const datas = JSON.parse(line.datas || '')
    const regex = /\${(.*?)}/g

    let stringToReturn = (CODES[line.codeId] || '')
    const tab = (stringToReturn.match(regex) || [])

    tab.map(find => {
      const key = find.slice(2, -1)
      if(datas[key]) {
        stringToReturn = stringToReturn.replace(find, datas[key])
      }
    })

    return stringToReturn
  }

  return Model
}
