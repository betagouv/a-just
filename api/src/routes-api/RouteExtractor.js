import Route, { Access } from './Route';
import { Types } from '../utils/types';
import { getHRVentilation } from '../utils/calculator';
import {
  addSumLine,
  autofitColumns,
  countEtp,
  flatListOfContentieuxAndSousContentieux,
  getIndispoDetails,
  replaceZeroByDash,
} from '../utils/extractor';
import { preformatHumanResources } from '../utils/ventilator';
import { getHumanRessourceList } from '../utils/humanServices';
import { findFonctionName } from '../utils/hr-fonctions';
import { findCategoryName } from '../utils/hr-catagories';
import { sumBy } from 'lodash';
import { findSituation } from '../utils/human-resource';
export default class RouteExtractor extends Route {
  constructor(params) {
    super({ ...params, model: 'HumanResources' });
  }

  @Route.Post({
    bodyType: Types.object().keys({
      backupId: Types.number().required(),
      dateStart: Types.date().required(),
      dateStop: Types.date().required(),
      categoryFilter: Types.string().required(),
    }),
    accesses: [Access.canVewHR],
  })
  async filterList(ctx) {
    let { backupId, dateStart, dateStop, categoryFilter } = this.body(ctx);

    if (!(await this.models.HRBackups.haveAccess(backupId, ctx.state.user.id))) {
      ctx.throw(401, "Vous n'avez pas accès à cette juridiction !");
    }

    const referentiels = await this.models.ContentieuxReferentiels.getReferentiels();

    const flatReferentielsList = await flatListOfContentieuxAndSousContentieux([...referentiels]);

    const hr = await this.model.getCache(backupId);

    const categories = await this.models.HRCategories.getAll();
    const fonctions = await this.models.HRFonctions.getAll();

    let allHuman = await getHumanRessourceList(hr, undefined, undefined, dateStart, dateStop);

    let data = new Array();

    //console.log('len human', allHuman.length);

    await Promise.all(
      allHuman.map(async (human) => {
        const { currentSituation } = findSituation(human);

        let categoryName = await findCategoryName(categories, currentSituation);
        let fonctionName = await findFonctionName(fonctions, currentSituation);

        let etpAffected = new Array();
        let refObj = { ...JSON.parse(JSON.stringify({})) };
        let totalEtpt = 0;

        let indispoArray = new Array([]);
        //console.log('flat ref', flatReferentielsList.length);
        indispoArray = [
          ...(await Promise.all(
            flatReferentielsList.map(async (referentiel) => {
              etpAffected = {
                ...(await getHRVentilation(
                  human,
                  referentiel.id,
                  [...categories],
                  dateStart,
                  dateStop
                )),
              };

              const { counterEtpTotal, counterEtpSubTotal, counterIndispo } = {
                ...(await countEtp({ ...etpAffected }, referentiel)),
              };

              const { refIndispo, allIndispRef, allIndispRefIds, idsMainIndispo } =
                await getIndispoDetails(flatReferentielsList);

              const isIndispoRef = await allIndispRefIds.includes(referentiel.id);

              if (referentiel.childrens !== undefined) {
                if (isIndispoRef) {
                  refObj[
                    'TOTAL ' +
                      referentiel.label.toUpperCase() +
                      ' ' +
                      referentiel.code_import.toUpperCase()
                  ] = 0;

                  return {
                    id: referentiel.id,
                    label:
                      'TOTAL ' +
                      referentiel.label.toUpperCase() +
                      ' ' +
                      referentiel.code_import.toUpperCase(),
                    indispo: 0,
                    contentieux: true,
                  };
                } else {
                  refObj[
                    'TOTAL ' +
                      referentiel.label.toUpperCase() +
                      ' ' +
                      referentiel.code_import.toUpperCase()
                  ] = counterEtpTotal;

                  totalEtpt += counterEtpTotal;
                }
              } else {
                if (isIndispoRef) {
                  refObj[
                    referentiel.label.toUpperCase() + ' ' + referentiel.code_import.toUpperCase()
                  ] = counterIndispo / 100;
                  return {
                    id: referentiel.id,
                    indispo: counterIndispo / 100,
                    contentieux: false,
                  };
                } else
                  refObj[
                    referentiel.label.toUpperCase() + ' ' + referentiel.code_import.toUpperCase()
                  ] = counterEtpSubTotal;
              }
              return { indispo: 0 };
            })
          )),
        ];
        //console.log('len', indispoArray.length);

        const key = (await indispoArray.filter((elem) => elem.contentieux === true)[0].label) || '';

        refObj[key] = sumBy(indispoArray, 'indispo');
        //console.log(refObj[key]);

        if (categoryName === categoryFilter || categoryFilter === 'tous')
          data.push({
            Numéro_A_JUST: human.id,
            Prénom: human.firstName,
            Nom: human.lastName,
            Catégorie: categoryName,
            Fonction: fonctionName,
            ETPT: totalEtpt,
            ...refObj,
          });
      })
    );

    await data.sort((a, b) => (a.last_nom > b.last_nom ? 1 : b.Fonction > a.Fonction ? -1 : 0));

    data = addSumLine(data, categoryFilter);
    data = replaceZeroByDash(data);
    const columnSize = await autofitColumns(data);
    this.sendOk(ctx, { values: data, columnSize });
  }
}
