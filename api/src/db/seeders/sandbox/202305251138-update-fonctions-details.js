module.exports = {
  up: async (queryInterface, Sequelize, models) => {
    const listMTIT = [
      'PRÉSIDENT',
      'PREMIER VICE-PRÉSIDENT',
      'PREMIER VICE-PRÉSIDENT ADJOINT',
      'PREMIER VICE-PRÉSIDENT CHARGÉ DES FONCTIONS DE JUGE DES CONTENTIEUX DE LA PROTECTION',
      'PREMIER VICE-PRÉSIDENT CHARGÉ DES FONCTIONS DE JUGE DES ENFANTS',
      "PREMIER VICE-PRÉSIDENT CHARGÉ DES FONCTIONS DE JUGE D'INSTRUCTION",
      "VICE-PRÉSIDENT CHARGÉ D'UN SECRÉTARIAT GÉNÉRAL",
      "PREMIER VICE-PRÉSIDENT CHARGÉ DES FONCTIONS DE JUGE DE L'APPLICATION DES PEINES",
      'PREMIER VICE-PRÉSIDENT CHARGÉ DES FONCTIONS DE JUGE DES LIBERTÉS ET DE LA DÉTENTION',
      'VICE-PRÉSIDENT',
      'VICE-PRÉSIDENT CHARGÉ DES FONCTIONS DE JUGE DES CONTENTIEUX DE LA PROTECTION',
      'VICE-PRÉSIDENT CHARGÉ DES FONCTIONS DE JUGE DES ENFANTS',
      "VICE-PRÉSIDENT CHARGÉ DES FONCTIONS DE JUGE D'INSTRUCTION",
      "VICE-PRÉSIDENT CHARGÉ DES FONCTIONS DE JUGE DE L'APPLICATION DES PEINES",
      'VICE-PRÉSIDENT CHARGÉ DES FONCTIONS DE JUGE DES LIBERTÉS ET DE LA DÉTENTION',
      'JUGE',
      'JUGE DES CONTENTIEUX DE LA PROTECTION',
      'JUGE DES ENFANTS',
      "JUGE D'INSTRUCTION",
      "JUGE D'APPLICATION DES PEINES",
    ]
    for (let k = 0; k < listMTIT.length; k++) {
      const findFct = await models.HRFonctions.findOne({
        where: {
          label: listMTIT[k],
        },
      })
      if (findFct) await findFct.update({ category_detail: 'M-TIT' })
    }

    const listMPlaceAdd = ['VICE-PRÉSIDENT PLACÉ', 'JUGE PLACÉ']
    for (let i = 0; i < listMPlaceAdd.length; i++) {
      const findFct = await models.HRFonctions.findOne({
        where: {
          label: listMPlaceAdd[i],
        },
      })
      if (findFct) await findFct.update({ category_detail: 'M-PLAC-ADD' })
    }

    const listMPCont = ['MAGISTRAT HONORAIRE JURIDICTIONNEL', 'MAGISTRAT HONORAIRE NON JURIDICTIONNEL', 'MAGISTRAT A TITRE TEMPORAIRE', 'MAGISTRAT RESERVISTE']
    for (let j = 0; j < listMPCont.length; j++) {
      const findFct = await models.HRFonctions.findOne({
        where: {
          label: listMPCont[j],
        },
      })
      if (findFct) await findFct.update({ category_detail: 'M-CONT' })
    }

    const listFTIT = ['A', 'CHEF DE CABINET', 'B GREFFIER', 'SA', 'CB', 'CT']
    for (let l = 0; l < listFTIT.length; l++) {
      const findFct = await models.HRFonctions.findOne({
        where: {
          label: listFTIT[l],
        },
      })
      if (findFct) await findFct.update({ category_detail: 'F-TIT' })
    }

    const listFPlaceADd = ['A PLACÉ', 'B GREFFIER PLACÉ', 'B PLACÉ', 'CB PLACÉ', 'CT PLACÉ']
    for (let m = 0; m < listFPlaceADd.length; m++) {
      const findFct = await models.HRFonctions.findOne({
        where: {
          label: listFPlaceADd[m],
        },
      })
      if (findFct) await findFct.update({ category_detail: 'F-PLAC-ADD' })
    }

    const listCont = [
      'GREFFIER RESERVISTE',
      'CONTRACTUEL A',
      'CONTRACTUEL B',
      'CONTRACTUEL C',
      'CONTRACTUEL CB',
      'CONTRACTUEL CT',
      'VACATAIRE',
      'CONTRACTUEL A JUSTICE DE PROXIMITE',
      'CONTRACTUEL B JUSTICE DE PROXIMITE',
      'CONTRACTUEL C JUSTICE DE PROXIMITE',
      'ASSISTANT SPECIALISE',
      'ASSISTANT DE JUSTICE',
      'JURISTE ASSISTANT',
      'ELEVE AVOCAT',
      'CONTRACTUEL A JUSTICE DE PROXIMITE',
      'CONTRACTUEL B JUSTICE DE PROXIMITE',
      'CONTRACTUEL C JUSTICE DE PROXIMITE',
    ]

    for (let n = 0; n < listCont.length; n++) {
      const findFct = await models.HRFonctions.findOne({
        where: {
          label: listCont[n],
        },
      })
      if (findFct) await findFct.update({ category_detail: 'C' })
    }
  },
  down: (/*queryInterface , Sequelize*/) => {},
}
