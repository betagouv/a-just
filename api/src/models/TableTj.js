export default (sequelizeInstance, Model) => {
  Model.getAll = () => {
    return Model.findAll({
      attributes: ['id', ['i_elst', 'iElst'], 'label', 'latitude', 'longitude', 'population', 'enabled'],
      order: [['label', 'asc']],
    })
  }

  return Model
}
