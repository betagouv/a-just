import Route, { Access } from './Route';
import { Types } from '../utils/types';
import { emptyCalulatorValues, syncCalculatorDatas } from '../constants/calculator';
import { getNbMonth } from '../utils/date';

export default class RouteCalculator extends Route {
  constructor(params) {
    super({ ...params, model: 'HumanResources' });
  }

  @Route.Post({
    bodyType: Types.object().keys({
      backupId: Types.number().required(),
      dateStart: Types.date().required(),
      dateStop: Types.date().required(),
      contentieuxIds: Types.array().required(),
      optionBackupId: Types.number().required(),
    }),
    accesses: [Access.canVewHR],
  })
  async filterList(ctx) {
    let { backupId, dateStart, dateStop, contentieuxIds, optionBackupId } = this.body(ctx);

    if (!(await this.models.HRBackups.haveAccess(backupId, ctx.state.user.id))) {
      ctx.throw(401, "Vous n'avez pas accès à cette juridiction !");
    }

    console.time('calculator-1');
    const referentiels = (await this.models.ContentieuxReferentiels.getReferentiels()).filter(
      (c) => contentieuxIds.indexOf(c.id) !== -1
    );
    console.timeEnd('calculator-1');

    console.time('calculator-2');
    const optionsBackups = await this.models.ContentieuxOptions.getAllById(optionBackupId);
    console.timeEnd('calculator-2');

    console.time('calculator-3');
    let list = emptyCalulatorValues(referentiels);
    console.timeEnd('calculator-3');

    console.time('calculator-4');
    const nbMonth = getNbMonth(dateStart, dateStop);
    console.timeEnd('calculator-4');

    console.time('calculator-5');
    const categories = await this.models.HRCategories.getAll();
    console.timeEnd('calculator-5');

    console.time('calculator-6');
    const hr = await this.model.getCache(backupId);
    console.timeEnd('calculator-6');

    console.time('calculator-7');
    const activities = await this.models.Activities.getAll(backupId);
    console.timeEnd('calculator-7');

    console.time('calculator-8');
    list = syncCalculatorDatas(
      list,
      nbMonth,
      activities,
      dateStart,
      dateStop,
      hr,
      categories,
      optionsBackups
    );
    console.timeEnd('calculator-8');

    this.sendOk(ctx, list);
  }
}
