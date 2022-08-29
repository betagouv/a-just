import Route, { Access } from './Route';
import { Types } from '../utils/types';
import {
  emptyCalulatorValues,
  getHRVentilation,
  syncCalculatorDatas,
} from '../constants/calculator';
import { countEtp, flatListOfContentieuxAndSousContentieux } from '../utils/extractor';
import { filterList } from './RouteHumanResources';
import { preformatHumanResources } from '../utils/ventilator';
import { findSituation, getHumanRessourceList } from '../utils/humanServices';
import { findFonctionName } from '../utils/hr-fonctions';
export default class RouteExtractor extends Route {
  constructor(params) {
    super({ ...params, model: 'HumanResources' });
  }

  @Route.Post({
    bodyType: Types.object().keys({
      backupId: Types.number().required(),
      dateStart: Types.date().required(),
      dateStop: Types.date().required(),
    }),
    accesses: [Access.canVewHR],
  })
  async filterList(ctx) {
    let { backupId, dateStart, dateStop } = this.body(ctx);

    if (!(await this.models.HRBackups.haveAccess(backupId, ctx.state.user.id))) {
      ctx.throw(401, "Vous n'avez pas accès à cette juridiction !");
    }

    console.time('extractor-1');
    const referentiels = await this.models.ContentieuxReferentiels.getReferentiels();
    console.timeEnd('extractor-1');

    const flatReferentielsList = flatListOfContentieuxAndSousContentieux(referentiels);

    const hr = await this.model.getCache(backupId);

    const preformatedAllHumanResource = preformatHumanResources(hr, dateStart);

    let allHuman = await getHumanRessourceList(
      preformatedAllHumanResource,
      flatReferentielsList.map((a) => a.id),
      [0, 1, 2],
      dateStart,
      dateStop
    );

    const categories = await this.models.HRCategories.getAll();
    const fonctions = await this.models.HRFonctions.getAll();

    let data = [];

    allHuman.map((human) => {
      const currentSituation = findSituation(human);
      let categoryName = findCategoryName(categories, currentSituation);
      let fonctionName = findFonctionName(fonctions, currentSituation);

      let etpAffected = [];
      let refObj = {};
      let totalEtpt = 0;

      const indispoArray = this.allReferentiels.map((referentiel) => {
        etpAffected = getHRVentilation(
          human,
          referentiel,
          [...this.categories],
          dateStart,
          dateStop
        );

        const { counterEtpTotal, counterEtpSubTotal } = countEtp(etpAffected, referentiel);

        const { refIndispo, allIndispRef, allIndispRefIds, idsMainIndispo } =
          getIndispoDetails(referentiel);

        const isIndispoRef = allIndispRefIds.includes(referentiel.id);

        if (referentiel.childrens !== undefined) {
          refObj['TOTAL ' + referentiel.label.toUpperCase()] = counterEtpTotal;

          totalEtpt += counterEtpTotal;

          if (isIndispoRef) {
            return {
              id: referentiel.id,
              label: 'TOTAL ' + referentiel.label.toUpperCase(),
              indispo: 0,
              contentieux: true,
            };
          }
        } else {
          refObj[referentiel.label.toUpperCase()] = counterEtpSubTotal;

          if (isIndispoRef) {
            return {
              id: referentiel.id,
              indispo: counterEtpSubTotal,
              contentieux: false,
            };
          }
        }
        return { indispo: 0 };
      });

      const key = indispoArray.filter((elem) => elem.contentieux === true)[0].label || '';

      refObj[key] = sumBy(indispoArray, 'indispo');

      if (
        categoryName === this.selectedCategory.getValue() ||
        this.selectedCategory.getValue() === 'tous'
      )
        data.push({
          Numéro_A_JUST: human.id,
          Prénom: human.firstName,
          Nom: human.lastName,
          Catégorie: categoryName,
          Fonction: fonctionName,
          ETPT: totalEtpt,
          ...refObj,
        });
    });

    this.sendOk(ctx, data);
  }
  /**
   
  allHuman.map((human: any) => {
              let categoryName = ''
              let fonctionName = ''

              const currentSituation =
                this.humanResourceService.findSituation(human)

              if (currentSituation && currentSituation.category) {
                const findCategory = this.categories.find(
                  (c) => c.id === currentSituation.category!.id
                )

                categoryName = findCategory
                  ? findCategory.label.toLowerCase()
                  : ''
              }

              if (currentSituation && currentSituation.fonction) {
                const findFonction = this.fonctions.find(
                  (f) => f.id === currentSituation.fonction!.id
                )
                fonctionName = findFonction
                  ? findFonction.label.toLowerCase()
                  : ''
              }

              let etpAffected: any = []
              let refObj: { [key: string]: any } = {}
              let totalEtpt = 0

              const indispoArray = this.allReferentiels.map(
                (referentiel: ContentieuReferentielInterface) => {
                  etpAffected = this.getHRVentilation(human, referentiel, [
                    ...this.categories,
                  ])

                  const { counterEtpTotal, counterEtpSubTotal } = this.countEtp(
                    etpAffected,
                    referentiel
                  )

                  const isIndispoRef =
                    this.humanResourceService.allIndisponibilityReferentielIds.includes(
                      referentiel.id
                    )

                  if (referentiel.childrens !== undefined) {
                    refObj['TOTAL ' + referentiel.label.toUpperCase()] =
                      counterEtpTotal

                    totalEtpt += counterEtpTotal

                    if (isIndispoRef) {
                      return {
                        id: referentiel.id,
                        label: 'TOTAL ' + referentiel.label.toUpperCase(),
                        indispo: 0,
                        contentieux: true,
                      }
                    }
                  } else {
                    refObj[referentiel.label.toUpperCase()] = counterEtpSubTotal

                    if (isIndispoRef) {
                      return {
                        id: referentiel.id,
                        indispo: counterEtpSubTotal,
                        contentieux: false,
                      }
                    }
                  }

                  return { indispo: 0 }
                }
              )

              const key =
                indispoArray.filter((elem) => elem.contentieux! === true)[0]
                  .label || ''

              refObj[key] = sumBy(indispoArray, 'indispo')

              if (
                categoryName === this.selectedCategory.getValue() ||
                this.selectedCategory.getValue() === 'tous'
              )
                this.data.push({
                  Numéro_A_JUST: human.id,
                  Prénom: human.firstName,
                  Nom: human.lastName,
                  Catégorie: categoryName,
                  Fonction: fonctionName,
                  ETPT: totalEtpt,
                  ...refObj,
                })
            })

 

   */
}
