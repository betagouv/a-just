import Route, { Access } from "./Route";
import { Types } from "../utils/types";
import { month, today } from "../utils/date";
import { preformatHumanResources } from "../utils/ventilator";
import { getHumanRessourceList } from "../utils/humanServices";
import { sumBy } from "lodash";
import {
  computeCoverage,
  computeDTES,
  computeRealTimePerCase,
} from "../utils/simulator";
import { fixDecimal } from "../utils/number";
import config from "config";
import { withAbortTimeout } from "../utils/abordTimeout";

/**
 * Route des calculs de la page calcule
 */

export default class RouteCalculator extends Route {
  // model de BDD
  model;

  /**
   * Constructeur
   * @param {*} params
   */
  constructor(params) {
    super(params);

    this.model = params.models.HumanResources;
  }

  /**
   * Interface des retours de calcul de la page calculateur
   * @param {*} backupId
   * @param {*} dateStart
   * @param {*} dateStop
   * @param {*} contentieuxIds
   * @param {*} optionBackupId
   * @param {*} categorySelected
   * @param {*} selectedFonctionsIds
   */
  @Route.Post({
    bodyType: Types.object().keys({
      backupId: Types.number().required(),
      dateStart: Types.date().required(),
      dateStop: Types.date().required(),
      contentieuxIds: Types.array().required(),
      optionBackupId: Types.number(),
      categorySelected: Types.string().required(),
      selectedFonctionsIds: Types.array(),
      loadChildrens: Types.boolean(),
    }),
    accesses: [Access.canVewCalculator],
  })
  async filterList(ctx) {
    try {
      await withAbortTimeout(async (signal) => {
        const { backupId } = this.body(ctx);

        if (
          !(await this.models.HRBackups.haveAccess(backupId, ctx.state.user.id))
        ) {
          ctx.throw(401, "Vous n'avez pas accès à cette juridiction !");
        }

        this.sendOk(
          ctx,
          await this.model.onCalculate(this.body(ctx), ctx.state.user, signal)
        );
      }, 60000); // timeout en ms
    } catch (err) {
      console.error("❌ Traitement interrompu :", err.message);
      ctx.status = 503;
      ctx.body = { error: err.message };
    }
  }

  /**
   * Interface des retours de calcul de la page calculateur
   * @param {*} backupId
   * @param {*} dateStart
   * @param {*} dateStop
   * @param {*} contentieuxIds
   * @param {*} optionBackupId
   * @param {*} categorySelected
   * @param {*} selectedFonctionsIds
   */
  @Route.Post({
    bodyType: Types.object().keys({
      backupId: Types.number(),
      dateStart: Types.date(),
      dateStop: Types.date(),
      contentieuxId: Types.number(),
      type: Types.string(),
      fonctionsIds: Types.array(),
      categorySelected: Types.string(),
    }),
    accesses: [Access.canVewCalculator],
  })
  async rangeValues(ctx) {
    let {
      backupId,
      dateStart,
      dateStop,
      contentieuxId,
      type,
      fonctionsIds,
      categorySelected,
    } = this.body(ctx);

    dateStart = today(dateStart);
    dateStop = today(dateStop);

    const hrList = await this.model.getCache(backupId);
    let endOfTheMonth = dateStart;

    const list = [];

    do {
      let endOfTheMonth = today(dateStart);
      endOfTheMonth = month(endOfTheMonth, 0, "lastday");

      switch (type) {
        case "entrees":
          {
            const activites = await this.models.Activities.getByMonth(
              dateStart,
              backupId,
              contentieuxId,
              false
            );
            if (activites.length) {
              const acti = activites[0];
              if (acti.entrees !== null) {
                list.push({ value: acti.entrees, date: new Date(dateStart) });
              } else if (acti.originalEntrees !== null) {
                list.push({
                  value: acti.originalEntrees,
                  date: new Date(dateStart),
                });
              } else {
                list.push({
                  value: null,
                  date: new Date(dateStart),
                });
              }
            }
          }
          break;
        case "sorties":
          {
            const activites = await this.models.Activities.getByMonth(
              dateStart,
              backupId,
              contentieuxId,
              false
            );
            if (activites.length) {
              const acti = activites[0];
              if (acti.sorties !== null) {
                list.push({ value: acti.sorties, date: new Date(dateStart) });
              } else if (acti.originalSorties !== null) {
                list.push({
                  value: acti.originalSorties,
                  date: new Date(dateStart),
                });
              } else {
                list.push({
                  value: null,
                  date: new Date(dateStart),
                });
              }
            }
          }
          break;
        case "stock":
        case "stocks":
          {
            const activites = await this.models.Activities.getByMonth(
              dateStart,
              backupId,
              contentieuxId,
              false
            );
            if (activites && activites.length) {
              const acti = activites[0];
              if (acti.stock !== null) {
                list.push({ value: acti.stock, date: new Date(dateStart) });
              } else if (acti.originalStock !== null) {
                list.push({
                  value: acti.originalStock,
                  date: new Date(dateStart),
                });
              } else {
                list.push({
                  value: null,
                  date: new Date(dateStart),
                });
              }
            }
          }
          break;
        case "ETPTEam":
        case "ETPTGreffe":
        case "ETPTSiege":
          {
            const catId =
              type === "ETPTSiege" ? 1 : type === "ETPTGreffe" ? 2 : 3;
            const fonctions = (await this.models.HRFonctions.getAll()).filter(
              (v) => v.categoryId === catId
            );
            let newFonctions = fonctionsIds;
            if (
              (newFonctions || []).every(
                (fonctionId) => !fonctions.find((f) => f.id === fonctionId)
              )
            ) {
              newFonctions = null;
            }

            const preformatedAllHumanResource = preformatHumanResources(
              hrList,
              dateStart,
              null,
              newFonctions
            );
            let hList = await getHumanRessourceList(
              preformatedAllHumanResource,
              [contentieuxId],
              undefined,
              [catId],
              dateStart,
              endOfTheMonth
            );
            let totalAffected = 0;
            hList.map((agent) => {
              const activities = (agent.currentActivities || []).filter(
                (r) => r.contentieux && r.contentieux.id === contentieuxId
              );
              const timeAffected = sumBy(activities, "percent");
              if (timeAffected) {
                let realETP = (agent.etp || 0) - agent.hasIndisponibility;
                if (realETP < 0) {
                  realETP = 0;
                }
                totalAffected += (timeAffected / 100) * realETP;
              }
            });
            list.push({ value: totalAffected, date: new Date(dateStart) });
          }
          break;
        case "dtes":
          {
            const catId = categorySelected === "magistrats" ? 1 : 2;
            const datas = await this.model.onCalculate(
              {
                backupId,
                dateStart,
                dateStop: endOfTheMonth,
                contentieuxIds: [contentieuxId],
                categorySelected: catId,
                selectedFonctionsIds: fonctionsIds,
                loadChildrens: false,
              },
              ctx.state.user,
              false
            );

            list.push({
              value: datas.list[0].realDTESInMonths,
              date: new Date(dateStart),
            });
          }
          break;
        case "temps-moyen":
          {
            const catId = categorySelected === "magistrats" ? 1 : 2;
            const datas = await this.model.onCalculate(
              {
                backupId,
                dateStart,
                dateStop: endOfTheMonth,
                contentieuxIds: [contentieuxId],
                categorySelected: catId,
                selectedFonctionsIds: fonctionsIds,
                loadChildrens: false,
              },
              ctx.state.user,
              false
            );

            list.push({
              value:
                catId === 1
                  ? datas.list[0].magRealTimePerCase
                  : datas.list[0].fonRealTimePerCase,
              date: new Date(dateStart),
            });
          }
          break;
        case "taux-couverture":
          {
            const activites = await this.models.Activities.getByMonth(
              dateStart,
              backupId,
              contentieuxId,
              false
            );
            if (activites.length) {
              const acti = activites[0];

              let sorties = null;
              if (acti.sorties !== null) {
                sorties = acti.sorties;
              } else if (acti.originalSorties !== null) {
                sorties = acti.originalSorties;
              }

              let entrees = null;
              if (acti.entrees !== null) {
                entrees = acti.entrees;
              } else if (acti.originalEntrees !== null) {
                entrees = acti.originalEntrees;
              }

              if (sorties !== null && entrees !== null) {
                list.push({
                  value: 100 * (sorties / entrees),
                  date: new Date(dateStart),
                });
              } else {
                list.push({
                  value: null,
                  date: new Date(dateStart),
                });
              }
            }
          }
          break;
        default:
          {
            console.log("type", type);
          }
          break;
      }

      dateStart = month(dateStart, 1);
    } while (dateStart.getTime() <= dateStop.getTime());

    this.sendOk(ctx, list);
  }
}
