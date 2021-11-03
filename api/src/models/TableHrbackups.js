export default (sequelizeInstance, Model) => {
  Model.createWithLabel = async (label) => {
    const creation = await Model.create({
      label,
    })

    return creation.dataValues.id
  }

  return Model
}