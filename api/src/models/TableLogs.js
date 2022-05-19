export default (sequelizeInstance, Model) => {
  Model.addLog = async (codeId, userId, datas = {}) => {
    await Model.create({
      code_id: codeId,
      user_id: userId,
      datas: JSON.stringify(datas),
    })
  }

  return Model
}
