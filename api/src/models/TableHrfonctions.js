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
      attributes: ['id', 'code', 'label', 'rank', 'category_detail', 'position', 'calculatrice_is_active', ['category_id', 'categoryId'], ['min_date_avalaible', 'minDateAvalaible'],['recoded_function', 'recodedFunction']],
      order: ['category_id', 'rank', 'id'],
      raw: true,
    })
  }

  /**
   * Liste de toutes les fonctions existantes avec Categorie label
   * @returns 
   */
  Model.getAllFormatDdg = async () => {
    let list = await Model.findAll({
      attributes: ['id', 'code', 'label', 'rank', 'category_detail', 'position', 'calculatrice_is_active', 'category_id', ['min_date_avalaible', 'minDateAvalaible'],['recoded_function', 'recodedFunction']],
      include: [
        {
          attributes: ['id', 'rank', 'label'],
          model: Model.models.HRCategories,
        },
      ],
      order: ['category_id', 'rank', 'id'],
      raw: true,
    })

    for (let i = 0; i < list.length; i++) {
      list[i] = {
        category_label: list[i]['HRCategory.label'],
        label:list[i].label,
        code: list[i].code,
        position: list[i].position,
        category_detail:list[i].category_detail,
        recodedFunction:list[i].recodedFunction,
        rank:list[i].rank,
      }
    }
    return list
  }

  return Model
}