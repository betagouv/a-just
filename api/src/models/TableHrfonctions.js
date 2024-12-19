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
      attributes: ['id', 'code', 'label', 'rank', 'category_detail', 'position', 'calculatrice_is_active', ['category_id', 'categoryId'], ['min_date_avalaible', 'minDateAvalaible']],
      order: ['category_id', 'rank', 'id'],
      raw: true,
    })
  }

  return Model
}
