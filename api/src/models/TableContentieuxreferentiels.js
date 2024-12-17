import { orderBy } from "lodash";
import { Op } from "sequelize";
import {
  referentielCAMappingIndex,
  referentielMappingIndex,
} from "../constants/referentiel";
import { extractCodeFromLabelImported } from "../utils/referentiel";
import { camel_to_snake } from "../utils/utils";
import config from "config";

/**
 * Scripts intermediaires des contentieux
 */

export default (sequelizeInstance, Model) => {
  /**
   * Retourne la liste du référentiel
   * @param {*} isJirs
   * @returns
   */
  Model.getReferentiels = async (backupId = null, isJirs = false) => {
    if (backupId) {
      const juridiction = await Model.models.HRBackups.findById(backupId);
      if (juridiction) {
        isJirs = juridiction.jirs;
      }
    }

    const formatToGraph = async (parentId = null, index = 0) => {
      const where = {};
      if (backupId) {
        where[Op.or] = [
          {
            only_to_hr_backup: null,
          },
          {
            only_to_hr_backup: { [Op.contains]: [backupId] },
          },
        ];
      }

      let list = await Model.findAll({
        attributes: [
          "id",
          "label",
          "code_import",
          "rank",
          ["value_quality_in", "valueQualityIn"],
          ["value_quality_out", "valueQualityOut"],
          ["value_quality_stock", "valueQualityStock"],
          ["help_url", "helpUrl"],
          "compter",
          ["only_to_hr_backup", "onlyToHrBackup"],
        ],
        where: {
          parent_id: parentId,
          ...where,
        },
        order: [["rank", "asc"]],
        raw: true,
      });

      if (list && list.length && index < 3) {
        for (let i = 0; i < list.length; i++) {
          list[i].childrens = await formatToGraph(list[i].id, index + 1);
        }
      }

      return list;
    };

    const mainList = await formatToGraph();
    let list = [];
    mainList.map((main) => {
      if (main.childrens) {
        main.childrens.map((subMain) => {
          if (subMain.childrens) {
            list = list.concat(subMain.childrens);
          }
        });
      }
    });

    // force to order list
    list = orderBy(
      list.map((r) => {
        // si A-JUST CA
        if (Number(config.juridictionType) === 1)
          r.rank = referentielCAMappingIndex(r.label, r.rank);
        else r.rank = referentielMappingIndex(r.label, r.rank);

        return r;
      }),
      ["rank"]
    );

    if (!isJirs) {
      list.map((elem) => {
        elem.childrens.map((child) => {
          switch (child.label) {
            case 'Contentieux collégial hors JIRS': //NEW CA
              child.label = 'Contentieux collégial';
              break; 
              case 'Contentieux JIRS éco-fi':
                elem.childrens = elem.childrens.filter(
                  (elem) => elem.label !== 'Contentieux JIRS éco-fi'
                );
                break;
              case 'Contentieux JIRS crim-org':
                elem.childrens = elem.childrens.filter(
                  (elem) => elem.label !== 'Contentieux JIRS crim-org'
                );
                break;
                

            case "Collégiales hors JIRS":
              child.label = "Collégiales";
              break;
            case "Cour d'assises hors JIRS":
              child.label = "Cour d'assises";
              break;
            case "Cour d'assises JIRS":
              elem.childrens = elem.childrens.filter(
                (elem) => elem.label !== "Cour d'assises JIRS"
              );
              break;
            case "Collégiales JIRS crim-org":
              elem.childrens = elem.childrens.filter(
                (elem) => elem.label !== "Collégiales JIRS crim-org"
              );
              break;
            case "Collégiales JIRS eco-fi":
              child.label = "Collégiales eco-fi";
              break;
            case "Eco-fi hors JIRS":
              child.label = "Eco-fi";
              break;
            case "JIRS éco-fi":
              elem.childrens = elem.childrens.filter(
                (elem) => elem.label !== "JIRS éco-fi"
              );
              break;
            case "JIRS crim-org":
              elem.childrens = elem.childrens.filter(
                (elem) => elem.label !== "JIRS crim-org"
              );
              break;
            case "JIRS":
              elem.childrens = elem.childrens.filter(
                (elem) => elem.label !== "JIRS"
              );
              break;
            case "Assises JIRS":
              elem.childrens = elem.childrens.filter(
                (elem) => elem.label !== "Assises JIRS"
              );
              break;
            case "Contentieux JIRS":
              elem.childrens = elem.childrens.filter(
                (elem) => elem.label !== "Contentieux JIRS"
              );
              break;
            case "Contentieux de la détention JIRS":
              elem.childrens = elem.childrens.filter(
                (elem) => elem.label !== "Contentieux de la détention JIRS"
              );
              break;
            case "Contentieux du contrôle judiciaire JIRS":
              elem.childrens = elem.childrens.filter(
                (elem) =>
                  elem.label !== "Contentieux du contrôle judiciaire JIRS"
              );
              break;
            case "Contentieux de fond JIRS":
              elem.childrens = elem.childrens.filter(
                (elem) => elem.label !== "Contentieux de fond JIRS"
              );
              break;
            case "Contentieux général hors JIRS":
              child.label = "Contentieux général";
              break;
            case "Contentieux spécialisés hors JIRS":
              child.label = "Contentieux spécialisés";
              break;
            case "Contentieux de la détention hors JIRS":
              child.label = "Contentieux de la détention";
              break;
            case "Contentieux du contrôle judiciaire hors JIRS":
              child.label = "Contentieux du contrôle judiciaire";
              break;
            case "Contentieux de fond hors JIRS":
              child.label = "Contentieux de fond";
              break;
            case "Assises hors JIRS":
              child.label = "Assises";
              break;
          }
        });
      });
    }

    return list;
  };

  /**
   * Importe une nouvelle liste de réfentiel et modifie, supprime et crée en fonction du code d'import.
   * @param {*} list
   * @returns
   */
  Model.importList = async (list) => {
    // The service work by label name and not by id. Find "niveau_3" or "niveau_4" and not "id"
    const listCodeUpdated = [];
    const deltaToUpdate = [];

    const minLevel = 3;
    const nbLevel = 4;

    for (let i = 0; i < list.length; i++) {
      const ref = list[i];
      let parentId = null;
      for (let i = minLevel - 1; i <= nbLevel; i++) {
        if (i === minLevel - 1) {
          // get main group
          const findInDb = await Model.findOne({
            where: {
              label: ref["niveau_" + i],
            },
            logging: false,
          });
          if (findInDb) {
            parentId = findInDb.dataValues.id;
          }
        }

        if (ref["niveau_" + i]) {
          const extract = extractCodeFromLabelImported(ref["niveau_" + i]);
          if (extract && extract.code) {
            if (listCodeUpdated.indexOf(extract.code) === -1) {
              listCodeUpdated.push(extract.code);
            }

            const findInDb = await Model.findOne({
              where: {
                code_import: extract.code,
              },
              logging: false,
            });
            if (!findInDb) {
              const newToDb = await Model.create(
                {
                  label: extract.label,
                  code_import: extract.code,
                  parent_id: parentId,
                },
                {
                  logging: false,
                }
              );

              parentId = newToDb.dataValues.id;
              deltaToUpdate.push({
                type: "CREATE",
                id: newToDb.dataValues.id,
                label: extract.label,
              });
            } else {
              if (extract.label !== findInDb.dataValues.label) {
                deltaToUpdate.push({
                  type: "UPDATE",
                  oldLabel: findInDb.dataValues.label,
                  id: findInDb.dataValues.id,
                  label: extract.label,
                });

                // update only one time
                await findInDb.update({ label: extract.label });
              }
              parentId = findInDb.dataValues.id;
            }
          }
        }
      }
    }

    // REMOVE OLD REFERENTIELS
    const listToRemove = await Model.findAll({
      attributes: ["id", "label", "code_import", "parent_id"],
      where: {
        code_import: {
          [Op.notIn]: listCodeUpdated,
        },
      },
      raw: true,
    });
    for (let i = 0; i < listToRemove.length; i++) {
      const l = listToRemove[i];
      await Model.destroyById(l.id);
      deltaToUpdate.push({
        type: "DELETE",
        label: l.label,
        id: l.id,
      });
    }

    const humanList = [];
    const idNacFinded = deltaToUpdate.map((d) => d.id);
    const humanFromDB = await Model.models.HumanResources.findAll({
      raw: true,
    });
    for (let i = 0; i < humanFromDB.length; i++) {
      const situations = await Model.models.HRSituations.getListByHumanId(
        humanFromDB[i].id
      );
      const activities = situations.reduce((acc, cur) => {
        const filterActivities = (cur.activities || []).filter(
          (c) => idNacFinded.indexOf(c.contentieux.id) !== -1
        );
        return acc.concat(filterActivities);
      }, []);

      if (activities.length) {
        const contentieuxIds = activities.map((a) => a.contentieux.id);
        humanList.push({
          person: humanFromDB[i],
          situations,
          activitiesImpacted: activities,
          impact: deltaToUpdate.filter(
            (d) => contentieuxIds.indexOf(d.id) !== -1
          ),
        });
      }
    }

    // order contentieux
    await Model.setRankToContentieux(list);

    return {
      persons: humanList,
      referentiel: deltaToUpdate,
    };
  };

  /**
   * Retourne le contentieux id en fonction de son nom
   * @param {*} label
   * @returns
   */
  Model.getContentieuxId = async (label) => {
    const listCont = await Model.findOne({
      attributes: ["id"],
      where: {
        label,
      },
      raw: true,
    });

    return listCont ? listCont.id : null;
  };

  /**
   * Update contentieux rank
   * @param {*} list
   */
  Model.setRankToContentieux = async (list, nodeLevel = 1) => {
    const listUpdated = [];
    let rank = 1;

    for (let i = 0; i < list.length; i++) {
      const extract = extractCodeFromLabelImported(
        list[i][`niveau_${nodeLevel}`]
      );
      if (extract) {
        let cont;

        if (extract.code) {
          const code = extract.code;

          if (!listUpdated.includes(code)) {
            listUpdated.push(code);

            cont = await Model.findOne({
              where: {
                code_import: code,
              },
            });
          }
        } else {
          const label = extract.label;

          if (!listUpdated.includes(label)) {
            listUpdated.push(label);

            cont = await Model.findOne({
              where: {
                label,
              },
            });
          }
        }

        if (cont) {
          rank++;
          await cont.update({ rank });
        }
      }
    }

    if (nodeLevel < 4) {
      await Model.setRankToContentieux(list, nodeLevel + 1);
    }
  };

  Model.updateRef = async (id, node, value) => {
    const ref = await Model.findOne({
      where: {
        id,
      },
    });

    if (ref) {
      ref.set({ [camel_to_snake(node)]: value });
      await ref.save();

      if (node === "onlyToHrBackup") {
        const hasChild = await Model.findOne({
          where: {
            parent_id: ref.dataValues.id,
          },
          raw: true,
        });
        if(!hasChild) {
          // synchronise by main contentieux
          await Model.models.HRActivities.syncAllActivitiesByContentieux(ref.dataValues.parent_id)
        }
      }
    }
  };

  Model.getOneReferentiel = async (id) => {
    const ref = await Model.findOne({
      where: {
        id,
      },
    });
    return ref ? ref : null;
  };

  return Model;
};
