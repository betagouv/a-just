import Route, { Access } from "./Route";
import { Types } from "../utils/types";
import { month } from "../utils/date";
import { preformatHumanResources } from "../utils/ventilator";
import { getHumanRessourceList } from "../utils/humanServices";
import { sumBy } from "lodash";
import { computeCoverage, computeDTES } from "../utils/simulator";

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
    const { backupId } = this.body(ctx);

    if (
      !(await this.models.HRBackups.haveAccess(backupId, ctx.state.user.id))
    ) {
      ctx.throw(401, "Vous n'avez pas accès à cette juridiction !");
    }

    this.sendOk(
      ctx,
      await this.model.onCalculate(this.body(ctx), ctx.state.user)
    );
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
    }),
    accesses: [Access.canVewCalculator],
  })
  async rangeValues(ctx) {
    let { backupId, dateStart, dateStop, contentieuxId, type, fonctionsIds } =
      this.body(ctx);
    console.log("body", this.body(ctx));
    dateStart = month(dateStart);
    dateStop = month(dateStop);
    const hrList = await this.model.getCache(backupId);

    const list = [];

    do {
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
                list.push(null);
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
                list.push(null);
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
                list.push(null);
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
              dateStart
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
            const activites = await this.models.Activities.getByMonth(
              dateStart,
              backupId,
              contentieuxId,
              false
            );
            if (activites && activites.length) {
              const acti = activites[0];
              let stock = null;
              let sorties = null;

              if (acti.stock !== null) {
                stock = acti.stock;
              } else if (acti.originalStock !== null) {
                stock = acti.originalStock;
              }

              if (acti.sorties !== null) {
                sorties = acti.sorties;
              } else if (acti.originalSorties !== null) {
                sorties = acti.originalSorties;
              }

              if (stock !== null && sorties !== null) {
                list.push({
                  value: computeDTES(stock, sorties),
                  date: new Date(dateStart),
                });
              } else {
                list.push(null);
              }
            }
          }
          break;
        case "temps-moyen":
          {
            const activites = await this.models.Activities.getByMonth(
              dateStart,
              backupId,
              contentieuxId,
              false
            );
            if (activites && activites.length) {
              const acti = activites[0];
              let entrees = null;
              let sorties = null;

              if (acti.entrees !== null) {
                entrees = acti.entrees;
              } else if (acti.originalEntrees !== null) {
                entrees = acti.originalEntrees;
              }

              if (acti.sorties !== null) {
                sorties = acti.sorties;
              } else if (acti.originalSorties !== null) {
                sorties = acti.originalSorties;
              }

              if (entrees !== null && sorties !== null) {
                list.push({
                  value: computeCoverage(sorties, entrees),
                  date: new Date(dateStart),
                });
              } else {
                list.push(null);
              }
            }
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
              if (acti.entrees !== null && acti.sorties !== null) {
                list.push({ value: acti.sorties / acti.entrees, date: new Date(dateStart) });
              } else if (acti.originalEntrees !== null && acti.originalSorties !== null) {
                list.push({
                  value: acti.originalSorties / acti.originalEntrees,
                  date: new Date(dateStart),
                });
              } else {
                list.push(null);
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
      //console.log(dateStart)

      dateStart.setMonth(dateStart.getMonth() + 1);
    } while (dateStart.getTime() <= dateStop.getTime());

    this.sendOk(ctx, list);
  }
}
