import { isCa } from "../../../utils/ca";

module.exports = {
  up: async (queryInterface, Sequelize, models) => {
    if (isCa()) {
      /** DEPLACER 6.1. ET 6.2. DANS 12. PP */
      const findSixUn = await models.ContentieuxReferentiels.findOne({
        where: {
          code_import: "6.1.",
        },
      });
      const findSixDeux = await models.ContentieuxReferentiels.findOne({
        where: {
          code_import: "6.2.",
        },
      });
      const findPPlvl3 = await models.ContentieuxReferentiels.findOne({
        where: {
          code_import: "12.",
        },
      });
      if (findPPlvl3) {
        await findSixUn.update({
          parent_id: findPPlvl3.dataValues.id,
        });
        await findSixDeux.update({
          parent_id: findPPlvl3.dataValues.id,
        });
      }

      /** DEPLACER 6.4 DANS 12. PP */
      const findSixQuatre = await models.ContentieuxReferentiels.findOne({
        where: {
          code_import: "6.4.",
        },
      });
      if (findPPlvl3) {
        await findSixQuatre.update({
          parent_id: findPPlvl3.dataValues.id,
        });
      }

      /** MERGE 6.3 IN 6.4 */
      const findSixTrois = await models.ContentieuxReferentiels.findOne({
        where: {
          code_import: "6.3.",
        },
      });
      const ACT63 = await models.HRActivities.findAll({
        where: {
          nac_id: findSixTrois.dataValues.id,
        },
      });

      for (let i = 0; i < ACT63.length; i++) {
        //FIND 6.4
        const ACT64 = await models.HRActivities.findOne({
          where: {
            hr_situation_id: ACT63[i].hr_situation_id,
            nac_id: findSixQuatre.dataValues.id,
          },
        });
        //IF 6.4 EXIST
        if (ACT64) {
          await ACT64.update({
            percent:
              (parseFloat(ACT64.dataValues.percent) || 0) +
              (parseFloat(ACT63[i].percent) || 0),
          });
          await ACT63[i].destroy();

          //IF 6.4 DOES NOT EXISTS
        } else {
          await ACT63[i].update({
            nac_id: findSixQuatre.dataValues.id,
          });
        }
      }

      /** SUPPRIMER LES VENTILLATIONS 6. CTX CIVIL JLD */
      const findSixZero = await models.ContentieuxReferentiels.findOne({
        where: {
          code_import: "6.",
        },
      });
      if (findSixZero) {
        // TROUVER TOUTES LES VENTILLATIONS 6.
        const act6 = await models.HRActivities.findAll({
          where: {
            nac_id: findSixZero.dataValues.id,
          },
        });
        // SUPPRIMER VENTILLATIONS
        for (let i = 0; i < act6.length; i++) {
          await act6[i].destroy();
        }
      }

      /** RECALCUL DU L3 PP */

      if (findPPlvl3) {
        // RECUPERER LES ID des L4 PP
        let L4PP = await models.ContentieuxReferentiels.findAll({
          where: {
            parent_id: findPPlvl3.dataValues.id,
          },
        });
        let idsL4PP = L4PP.map((x) => x.id);

        // TROUVER TOUTES LES VENTILLATIONS L4 PP
        const actL4PP = await models.HRActivities.findAll({
          where: {
            nac_id: idsL4PP,
          },
        });

        // POUR CHAQUE VENTILLATIONS L4 PP
        for (let k = 0; k < actL4PP.length; k++) {
          // TROUVER TOUTES LES VENTILLATIONS L4 DU PP POUR UNE SITUATION
          let all12Ventillations = await models.HRActivities.findAll({
            where: {
              hr_situation_id: actL4PP[k].hr_situation_id,
              nac_id: idsL4PP,
            },
          });

          // RECUPERER LES % DE CHAQUE L4 DU PP POUR UNE SITUATION
          let percents = all12Ventillations.map((x) => parseFloat(x.percent));
          // SOMME % L4
          let totalPercent = percents.reduce((acc, val) => (acc += val), 0);

          // CHERCHER SI UN L3 EXISTE POUR UNE SITUATION
          const findL3PP = await models.HRActivities.findOne({
            where: {
              hr_situation_id: actL4PP[k].hr_situation_id,
              nac_id: findPPlvl3.id,
            },
          });

          // SI L3 PP EXISTE MAJ %
          if (findL3PP)
            await findL3PP.update({
              percent: totalPercent,
            });
          // SINON CREER TOTAL PP L3
          else {
            await models.HRActivities.create({
              hr_situation_id: actL4PP[k].hr_situation_id,
              nac_id: findPPlvl3.dataValues.id,
              percent: totalPercent,
            });
          }
        }
      }

      /** DEPLACEMENT DES TUTELLES MINEURS 3.4 DANS CTX PROTECTION 4. */

      const find34 = await models.ContentieuxReferentiels.findOne({
        where: {
          code_import: "3.4.",
        },
      });

      const find4 = await models.ContentieuxReferentiels.findOne({
        where: {
          code_import: "4.",
        },
      });

      if (find4) {
        await find34.update({
          parent_id: find4.dataValues.id,
        });
      }

      /** RECALCUL DU L3 PTX DE DESTINATION*/

      // RECUPERER LES ID des L4 4. PTX
      let L4PTX = await models.ContentieuxReferentiels.findAll({
        where: {
          parent_id: find4.dataValues.id,
        },
      });
      let idsL4PTX = L4PTX.map((x) => x.id);

      // TROUVER TOUTES LES VENTILLATIONS L4 PTX
      const actL4PTX = await models.HRActivities.findAll({
        where: {
          nac_id: idsL4PTX,
        },
      });

      // POUR CHAQUE VENTILLATIONS L4 PTX
      for (let k = 0; k < actL4PTX.length; k++) {
        // TROUVER TOUTES LES VENTILLATIONS L4 DU PTX POUR UNE SITUATION
        let all4Ventillations = await models.HRActivities.findAll({
          where: {
            hr_situation_id: actL4PTX[k].hr_situation_id,
            nac_id: idsL4PTX,
          },
        });

        // RECUPERER LES % DE CHAQUE L4 DU PTX POUR UNE SITUATION
        let percents = all4Ventillations.map((x) => parseFloat(x.percent));
        // SOMME % L4
        let totalPercent = percents.reduce((acc, val) => (acc += val), 0);

        // CHERCHER SI UN L3 EXISTE POUR UNE SITUATION
        const findL3PTX = await models.HRActivities.findOne({
          where: {
            hr_situation_id: actL4PTX[k].hr_situation_id,
            nac_id: find4.dataValues.id,
          },
        });

        // SI L3 PTX EXISTE MAJ %
        if (findL3PTX)
          await findL3PTX.update({
            percent: totalPercent,
          });
        // SINON CREER TOTAL PTX L3
        else {
          await models.HRActivities.create({
            hr_situation_id: actL4PTX[k].hr_situation_id,
            nac_id: find4.dataValues.id,
            percent: totalPercent,
          });
        }
      }

      /** RECALCUL DU L3 FA */

      const find3 = await models.ContentieuxReferentiels.findOne({
        where: {
          code_import: "3.",
        },
      });

      // RECUPERER LES ID des L4 3. Famille
      let L4FA = await models.ContentieuxReferentiels.findAll({
        where: {
          parent_id: find3.dataValues.id,
        },
      });
      let idsL4FA = L4FA.map((x) => x.id);

      // TROUVER TOUTES LES VENTILLATIONS L3 FA
      const actL3FA = await models.HRActivities.findAll({
        where: {
          nac_id: find3.dataValues.id,
        },
      });
      // POUR CHAQUE VENTILLATIONS L3 FA
      for (let k = 0; k < actL3FA.length; k++) {
        // TROUVER TOUTES LES VENTILLATIONS L4 FA
        let all3Ventillations = await models.HRActivities.findAll({
          where: {
            hr_situation_id: actL3FA[k].hr_situation_id,
            nac_id: idsL4FA,
          },
        });

        // RECUPERER LES % DE CHAQUE L4 DU PTX POUR UNE SITUATION
        let percents = all3Ventillations.map((x) => parseFloat(x.percent));
        // SOMME % L4
        let totalPercent = percents.reduce((acc, val) => (acc += val), 0);

        let act34 = await models.HRActivities.findOne({
          where: {
            hr_situation_id: actL3FA[k].hr_situation_id,
            nac_id: find34.dataValues.id,
          },
        });

        if (act34)
          await actL3FA[k].update({
            percent: totalPercent,
          });
      }
    }
  },
  down: (/*queryInterface , Sequelize*/) => {},
};
