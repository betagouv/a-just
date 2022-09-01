import Route, { Access } from './Route';
import { Types } from '../utils/types';
import { getHRVentilation } from '../constants/calculator';
import {
  addSumLine,
  autofitColumns,
  countEtp,
  flatListOfContentieuxAndSousContentieux,
  getIndispoDetails,
} from '../utils/extractor';
import { preformatHumanResources } from '../utils/ventilator';
import { findSituation, getHumanRessourceList } from '../utils/humanServices';
import { findFonctionName } from '../utils/hr-fonctions';
import { findCategoryName } from '../utils/hr-catagories';
import { sortBy, sumBy } from 'lodash';
import { filterActivitiesByDateAndContentieuxId } from '../utils/activities';
import { month } from '../utils/date';
import { getLastActivity, getSituation } from '../utils/simulator';

export default class RouteSimulator extends Route {
  constructor(params) {
    super({ ...params, model: 'HumanResources' });
  }

  @Route.Post({
    bodyType: Types.object().keys({
      backupId: Types.number().required(),
      referentielId: Types.number().required(),
      dateStart: Types.date(),
      dateStop: Types.date(),
    }),
    accesses: [Access.canVewHR],
  })
  async getSituation(ctx) {
    let { backupId, referentielId, dateStart, dateStop } = this.body(ctx);

    if (!(await this.models.HRBackups.haveAccess(backupId, ctx.state.user.id))) {
      ctx.throw(401, "Vous n'avez pas accès à cette juridiction !");
    }

    const hr = await this.model.getCache(backupId);

    const categories = await this.models.HRCategories.getAll();

    const activities = await this.models.Activities.getAll(backupId);

    const situation = await getSituation(referentielId, hr, activities, categories);

    this.sendOk(ctx, { situation, categories, hr });
  }
}
