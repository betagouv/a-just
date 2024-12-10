import { isCa } from "../../../utils/ca";

module.exports = {
  up: async (queryInterface, Sequelize, models) => {
    if (isCa()) {
      // DEPLACER 6.1. et 6.2. dans 12. PP
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
        findSixUn.update({
          parent_id: findPPlvl3.dataValues.id,
        });
        findSixDeux.update({
          parent_id: findPPlvl3.dataValues.id,
        });
      }

      // DEPLACER 6.4. dans 12. PP
      const findSixQuatre = await models.ContentieuxReferentiels.findOne({
        where: {
          code_import: "6.4.",
        },
      });
      if (findPPlvl3) {
        findSixQuatre.update({
          parent_id: findPPlvl3.dataValues.id,
        });
      }

      // MERGE 6.3. dans 6.4.
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
          ACT64.update({
            percent:
              (parseFloat(ACT64.dataValues.percent) || 0) +
              (parseFloat(ACT63[i].percent) || 0),
          });
          ACT63[i].destroy();

          //IF 6.4 DOES NOT EXISTS
        } else {
          await ACT63[i].update({
            nac_id: findSixQuatre.dataValues.id,
          });
        }
      }

      // SUPPRIMER 6. VENTILLATIONS
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
          act6[i].destroy();
        }
      }

      //RECALCULER L3 PP
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
            findL3PP.update({
              percent: totalPercent,
            });
          // SINON CREER TOTAL PP L3
          else {
            models.HRActivities.create({
              hr_situation_id: actL4PP[k].hr_situation_id,
              nac_id: findPPlvl3.dataValues.id,
              percent: totalPercent,
            });
          }
        }
      }
    }
  },
  down: (/*queryInterface , Sequelize*/) => {},
};
