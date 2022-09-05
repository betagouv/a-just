import Route, { Access } from './Route';
import { Types } from '../utils/types';
import { USER_REMOVE_HR } from '../constants/log-codes';
import { preformatHumanResources } from '../utils/ventilator';
import { getCategoryColor } from '../constants/categories';
import { sumBy } from 'lodash';
import { copyArray } from '../utils/array';
import { getHumanRessourceList } from '../utils/humanServices';

export default class RouteHumanResources extends Route {
  constructor(params) {
    super({ ...params, model: 'HumanResources' });

    this.model.onPreload();
  }

  @Route.Post({
    bodyType: Types.object().keys({
      backupId: Types.any(),
    }),
    accesses: [Access.canVewHR],
  })
  async getCurrentHr(ctx) {
    let { backupId } = this.body(ctx);
    const backups = await this.model.models.HRBackups.list(ctx.state.user.id);
    backupId = backupId || (backups.length ? backups[backups.length - 1].id : null);

    this.sendOk(ctx, {
      backups,
      backupId,
      categories: await this.models.HRCategories.getAll(),
      fonctions: await this.models.HRFonctions.getAll(),
    });
  }

  @Route.Delete({
    path: 'remove-backup/:backupId',
    accesses: [Access.canVewHR],
  })
  async removeBackup(ctx) {
    const { backupId } = ctx.params;

    await this.model.models.HRBackups.removeBackup(backupId);

    this.sendOk(ctx, 'OK');
  }

  @Route.Post({
    bodyType: Types.object().keys({
      backupId: Types.number().required(),
      backupName: Types.string().required(),
    }),
    accesses: [Access.canVewHR],
  })
  async duplicateBackup(ctx) {
    const { backupId, backupName } = this.body(ctx);

    this.sendOk(ctx, await this.model.models.HRBackups.duplicateBackup(backupId, backupName));
  }

  @Route.Get({
    accesses: [Access.isAdmin],
  })
  async getBackupList(ctx) {
    this.sendOk(ctx, await this.model.models.HRBackups.getAll());
  }

  @Route.Post({
    bodyType: Types.object().keys({
      backupId: Types.number(),
      hr: Types.any(),
    }),
    accesses: [Access.canVewHR],
  })
  async updateHr(ctx) {
    let { backupId, hr } = this.body(ctx);

    const responseUpdate = await this.model.updateHR(hr, backupId);

    this.sendOk(ctx, responseUpdate);
  }

  @Route.Delete({
    path: 'remove-hr/:hrId',
    accesses: [Access.canVewHR],
  })
  async removeHR(ctx) {
    const { hrId } = ctx.params;

    if (await this.models.HumanResources.haveAccess(hrId, ctx.state.user.id)) {
      const onRemoveHR = await this.model.removeHR(hrId);

      if (onRemoveHR) {
        this.sendOk(ctx, 'Ok');
        await this.models.Logs.addLog(USER_REMOVE_HR, ctx.state.user.id, {
          hrId,
        });
      } else {
        ctx.throw(401, "Cette personne n'est pas supprimable !");
      }
    } else {
      this.sendOk(ctx, null);
    }
  }

  @Route.Delete({
    path: 'remove-situation/:situationId',
    accesses: [Access.canVewHR],
  })
  async removeSituation(ctx) {
    const { situationId } = ctx.params;
    const hrId = await this.models.HRSituations.haveHRId(situationId, ctx.state.user.id);
    if (hrId) {
      if (await this.models.HRSituations.destroyById(situationId)) {
        this.sendOk(ctx, await this.model.getHr(hrId));
      }
    }

    this.sendOk(ctx, null);
  }

  @Route.Post({
    bodyType: Types.object().keys({
      backupId: Types.number().required(),
      date: Types.date().required(),
      contentieuxIds: Types.array().required(),
      categoriesIds: Types.array().required(),
      extractor: Types.boolean().required(),
      endPeriodToCheck: Types.date(),
    }),
    accesses: [Access.canVewHR],
  })
  async filterList(ctx) {
    let { backupId, date, endPeriodToCheck, categoriesIds, contentieuxIds, extractor } =
      this.body(ctx);
    if (!(await this.models.HRBackups.haveAccess(backupId, ctx.state.user.id))) {
      ctx.throw(401, "Vous n'avez pas accès à cette juridiction !");
    }

    console.time('step1');
    const hr = await this.model.getCache(backupId);
    console.log('bam', hr.length);
    console.timeEnd('step1');
    console.time('step2');
    const preformatedAllHumanResource = preformatHumanResources(hr, date);
    console.log('bam', preformatedAllHumanResource.length);
    console.timeEnd('step2');
    let list = getHumanRessourceList(
      preformatedAllHumanResource,
      contentieuxIds,
      categoriesIds,
      date,
      endPeriodToCheck
    );

    console.log('bamBoum', extractor);

    if (extractor === false) {
      let listFiltered = [...list];
      console.log('listFiltered', listFiltered.length, listFiltered, typeof list);
      const categories = await this.models.HRCategories.getAll();
      const originalReferentiel = (
        await this.models.ContentieuxReferentiels.getReferentiels()
      ).filter((r) => contentieuxIds.indexOf(r.id) !== -1);

      const listFormated = categories
        .filter((c) => categoriesIds.indexOf(c.id) !== -1)
        .map((category) => {
          let label = category.label;

          let referentiel = copyArray(originalReferentiel).map((ref) => {
            ref.totalAffected = 0;
            return ref;
          });

          let group = listFiltered
            .filter((h) => h.category && h.category.id === category.id)
            .map((hr) => {
              hr.tmpActivities = {};

              referentiel = referentiel.map((ref) => {
                hr.tmpActivities[ref.id] = hr.currentActivities.filter(
                  (r) => r.contentieux && r.contentieux.id === ref.id
                );
                if (hr.tmpActivities[ref.id].length) {
                  const timeAffected = sumBy(hr.tmpActivities[ref.id], 'percent');
                  if (timeAffected) {
                    let realETP = (hr.etp || 0) - hr.hasIndisponibility;
                    if (realETP < 0) {
                      realETP = 0;
                    }
                    ref.totalAffected = (ref.totalAffected || 0) + (timeAffected / 100) * realETP;
                  }
                }

                return ref;
              });

              return hr;
            });

          if (group.length > 1) {
            if (label.indexOf('agistrat') !== -1) {
              label = label.replace('agistrat', 'agistrats');
            } else {
              label += 's';
            }
          }

          console.log('hr', group);
          return {
            textColor: getCategoryColor(label),
            bgColor: getCategoryColor(label, 0.2),
            referentiel,
            label,
            hr: group,
            categoryId: category.id,
          };
        });
      console.log('step7');
      console.log(extractor);

      this.sendOk(ctx, {
        list: listFormated,
      });
    } else {
      console.log(extractor);

      console.timeEnd('step5');
      console.log('step6');

      this.sendOk(ctx, {
        list,
      });
    }
  }

  @Route.Get({
    path: 'read-hr/:hrId',
    accesses: [Access.canVewHR],
  })
  async readHr(ctx) {
    const { hrId } = ctx.params;

    if (await this.model.haveAccess(hrId, ctx.state.user.id)) {
      this.sendOk(ctx, await this.model.getHrDetails(hrId));
    } else {
      this.sendOk(ctx, null);
    }
  }
}
