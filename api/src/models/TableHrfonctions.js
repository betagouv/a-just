/**
 * Liste des fonctions des fiches (1VP, VP, 2VP)
 */

export default (sequelizeInstance, Model) => {
  /**
   * Liste de toutes les fonctions existantes
   * @returns
   */
  Model.getAll = async () => {
    return await Model.findAll({
      attributes: ['id', 'code', 'label', 'rank', 'category_detail', ['category_id', 'categoryId']],
      order: ['category_id', 'rank'],
      raw: true,
    })
  }

  return Model
}
