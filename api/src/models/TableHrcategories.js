/**
 * Liste des categories d'un magistrat
 */

export default (sequelizeInstance, Model) => {
  /**
   * Liste de toutes les catégories existantes
   * @returns
   */
  Model.getAll = async () => {
    return await Model.findAll({
      attributes: ['id', 'label', 'rank'],
      order: ['rank'],
      raw: true,
    })
  }

  return Model
}
