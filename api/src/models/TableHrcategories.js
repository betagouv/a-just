import { getCategoryColor, getBgCategoryColor } from '../constants/categories'

/**
 * Liste des categories d'un magistrat
 */

export default (sequelizeInstance, Model) => {
  /**
   * Liste de toutes les catégories existantes
   * @returns
   */
  Model.getAll = async () => {
    return (
      await Model.findAll({
        attributes: ['id', 'label', 'rank'],
        order: ['rank'],
        raw: true,
      })
    ).map((c) => ({
      ...c,
      textColor: getCategoryColor(c.label),
      bgColor: getBgCategoryColor(c.label),
    }))
  }

  return Model
}
