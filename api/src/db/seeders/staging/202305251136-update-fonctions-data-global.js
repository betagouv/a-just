module.exports = {
  up: async (queryInterface, Sequelize, models) => {
    const findMag = await models.HRCategories.findOne({
      where: {
        label: 'Magistrat',
      },
      raw: true,
    })

    // Maj MAG
    if (findMag) {
      const findMHFJ = await models.HRFonctions.findOne({
        where: {
          label: 'Magistrat honoraire (MHFJ)',
        },
      })
      if (findMHFJ) await findMHFJ.update({ label: 'MAGISTRAT HONORAIRE JURIDICTIONNEL', code: 'MHFJ', category_id: findMag.id, rank: 23 })

      await models.HRFonctions.create({
        label: 'MAGISTRAT HONORAIRE NON JURIDICTIONNEL',
        code: 'MHFNJ',
        rank: 24,
        category_id: findMag.id,
      })

      const findMTT = await models.HRFonctions.findOne({
        where: {
          label: 'Magistrat à titre temporaire',
        },
      })
      if (findMTT) await findMTT.update({ label: 'MAGISTRAT A TITRE TEMPORAIRE', code: 'MTT', category_id: findMag.id, rank: 25 })

      await models.HRFonctions.create({
        label: 'MAGISTRAT RESERVISTE',
        code: 'MRES',
        rank: 26,
        category_id: findMag.id,
      })
    }

    const findGreff = await models.HRCategories.findOne({
      where: {
        label: 'Fonctionnaire',
      },
    })

    // Maj Greff
    if (findGreff) {
      await findGreff.update({ label: 'Greffe' })

      await models.HRFonctions.create({
        label: 'CHEF DE CABINET',
        code: 'CHCAB',
        rank: 2,
        category_id: findGreff.dataValues.id,
      })

      const findBGref = await models.HRFonctions.findOne({
        where: {
          label: 'B greffier',
        },
      })
      if (findBGref) await findBGref.update({ label: 'B GREFFIER', code: 'B', rank: 3 })

      const findSA = await models.HRFonctions.findOne({
        where: {
          label: 'SA',
        },
      })
      if (findSA) await findSA.update({ rank: 4 })

      const findCB = await models.HRFonctions.findOne({
        where: {
          label: 'CB',
        },
      })
      if (findCB) await findCB.update({ rank: 5 })

      const findCT = await models.HRFonctions.findOne({
        where: {
          label: 'CT',
        },
      })
      if (findCT) await findCT.update({ rank: 6 })

      const findAPLACE = await models.HRFonctions.findOne({
        where: {
          label: 'A placé',
        },
      })
      if (findAPLACE) await findAPLACE.update({ label: 'A PLACÉ', code: 'A PLACÉ', rank: 7 })

      const findBGREFFPLACE = await models.HRFonctions.findOne({
        where: {
          label: 'B greffier placé',
        },
      })
      if (findBGREFFPLACE) await findBGREFFPLACE.update({ label: 'B GREFFIER PLACÉ', code: 'B GREF  PLACÉ', rank: 8 })

      const findBPLACE = await models.HRFonctions.findOne({
        where: {
          label: 'B placé',
        },
      })
      if (findBPLACE) await findBPLACE.update({ label: 'B PLACÉ', code: 'B PLACÉ', rank: 9 })

      const findCBPLACE = await models.HRFonctions.findOne({
        where: {
          label: 'CB placé',
        },
      })
      if (findCBPLACE) await findCBPLACE.update({ label: 'CB PLACÉ', code: 'CB PLACÉ', rank: 10 })

      const findCTPLACE = await models.HRFonctions.findOne({
        where: {
          label: 'CT placé',
        },
      })
      if (findCTPLACE) await findCTPLACE.update({ label: 'CT PLACÉ', code: 'CT PLACÉ', rank: 11 })

      await models.HRFonctions.create({
        label: 'GREFFIER RESERVISTE',
        code: 'GRES',
        rank: 12,
        category_id: findGreff.dataValues.id,
      })

      const findCONTA = await models.HRFonctions.findOne({
        where: {
          label: 'Contractuel A',
        },
      })
      if (findCONTA) await findCONTA.update({ label: 'CONTRACTUEL A', code: 'CONT A', rank: 13, category_id: findGreff.dataValues.id })
    }

    const findContractuel = await models.HRCategories.findOne({
      where: {
        label: 'Contractuel',
      },
    })

    // Maj Greff
    if (findContractuel && findGreff) {
      await findContractuel.update({ label: 'Autour du Juge' })

      const findCONTBGreff = await models.HRFonctions.findOne({
        where: {
          label: 'B contractuel',
          category_id: findGreff.dataValues.id,
        },
      })
      if (findCONTBGreff) await findCONTBGreff.update({ label: 'CONTRACTUEL B', code: 'CONT B', rank: 14 })

      const findCONTBCont = await models.HRFonctions.findOne({
        where: {
          label: 'Contractuel B',
          category_id: findContractuel.dataValues.id,
        },
      })

      const allSituationCONTBCont = await models.HRSituations.findAll({
        where: {
          fonction_id: findCONTBCont.dataValues.id,
        },
      })

      for (let i = 0; i < allSituationCONTBCont.length; i++) {
        if (allSituationCONTBCont[i])
          await allSituationCONTBCont[i].update({
            fonction_id: findCONTBGreff.dataValues.id,
            category_id: findGreff.dataValues.id,
          })
      }

      await models.HRFonctions.destroy({
        where: {
          id: findCONTBCont.dataValues.id,
        },
      })

      const findCONTCGreff = await models.HRFonctions.findOne({
        where: {
          label: 'C contractuel',
          category_id: findGreff.dataValues.id,
        },
      })
      if (findCONTCGreff) await findCONTCGreff.update({ label: 'CONTRACTUEL C', code: 'CONT C', rank: 15 })

      const findCONTCCont = await models.HRFonctions.findOne({
        where: {
          label: 'Contractuel C',
          category_id: findContractuel.dataValues.id,
        },
      })

      const allSituationCONTCCont = await models.HRSituations.findAll({
        where: {
          fonction_id: findCONTCCont.dataValues.id,
        },
      })

      for (let i = 0; i < allSituationCONTCCont.length; i++) {
        if (allSituationCONTCCont[i])
          await allSituationCONTCCont[i].update({
            fonction_id: findCONTCGreff.dataValues.id,
            category_id: findGreff.dataValues.id,
          })
      }

      await models.HRFonctions.destroy({
        where: {
          id: findCONTCCont.dataValues.id,
        },
      })

      await models.HRFonctions.create({
        label: 'CONTRACTUEL CB',
        code: 'CONT CB',
        rank: 16,
        category_id: findGreff.dataValues.id,
      })

      await models.HRFonctions.create({
        label: 'CONTRACTUEL CT',
        code: 'CONT CT',
        rank: 17,
        category_id: findGreff.dataValues.id,
      })

      const findVacGreffe = await models.HRFonctions.findOne({
        where: {
          label: 'Vacataire',
          category_id: findGreff.dataValues.id,
        },
      })
      if (findVacGreffe) await findVacGreffe.update({ label: 'VACATAIRE', code: 'VAC', rank: 18 })

      await models.HRFonctions.create({
        label: 'CONTRACTUEL A JUSTICE DE PROXIMITE',
        code: 'CONT AJP',
        rank: 19,
        category_id: findGreff.dataValues.id,
      })

      await models.HRFonctions.create({
        label: 'CONTRACTUEL B JUSTICE DE PROXIMITE',
        code: 'CONT BJP',
        rank: 20,
        category_id: findGreff.dataValues.id,
      })

      await models.HRFonctions.create({
        label: 'CONTRACTUEL C JUSTICE DE PROXIMITE',
        code: 'CONT CJP',
        rank: 21,
        category_id: findGreff.dataValues.id,
      })
    }

    //Maj cont
    if (findContractuel) {
      const findAssSpe = await models.HRFonctions.findOne({
        where: {
          label: 'Assistant spécialisé',
          category_id: findContractuel.dataValues.id,
        },
      })
      if (findAssSpe) await findAssSpe.update({ label: 'ASSISTANT SPECIALISE', code: 'AS', rank: 1 })

      const findAssJu = await models.HRFonctions.findOne({
        where: {
          label: 'Assistant de justice',
          category_id: findContractuel.dataValues.id,
        },
      })
      if (findAssJu) await findAssJu.update({ label: 'ASSISTANT DE JUSTICE', code: 'ADJ', rank: 2 })

      const findAssJA = await models.HRFonctions.findOne({
        where: {
          label: 'Juriste assistant',
          category_id: findContractuel.dataValues.id,
        },
      })
      if (findAssJA) await findAssJA.update({ label: 'JURISTE ASSISTANT', code: 'JA', rank: 3 })

      await models.HRFonctions.create({
        label: 'ELEVE AVOCAT',
        code: 'PPI',
        rank: 4,
        category_id: findContractuel.dataValues.id,
      })

      await models.HRFonctions.create({
        label: 'CONTRACTUEL A JUSTICE DE PROXIMITE',
        code: 'CONT AJP',
        rank: 5,
        category_id: findContractuel.dataValues.id,
      })

      await models.HRFonctions.create({
        label: 'CONTRACTUEL B JUSTICE DE PROXIMITE',
        code: 'CONT BJP',
        rank: 6,
        category_id: findContractuel.dataValues.id,
      })

      await models.HRFonctions.create({
        label: 'CONTRACTUEL C JUSTICE DE PROXIMITE',
        code: 'CONT CJP',
        rank: 7,
        category_id: findContractuel.dataValues.id,
      })
    }

    await models.HRFonctions.destroy({
      where: {
        label: 'Autre',
        category_id: findContractuel.dataValues.id,
      },
    })

    const listPlaces = ['VICE-PRÉSIDENT PLACÉ', 'JUGE PLACÉ', 'A PLACÉ', 'B GREFFIER PLACÉ', 'B PLACÉ', 'CB PLACÉ', 'CT PLACÉ']
    for (let i = 0; i < listPlaces.length; i++) {
      const findFct = await models.HRFonctions.findOne({
        where: {
          label: listPlaces[i],
        },
      })
      if (findFct) await findFct.update({ position: 'Placé' })
    }

    const listCont = [
      'MAGISTRAT HONORAIRE JURIDICTIONNEL',
      'MAGISTRAT HONORAIRE NON JURIDICTIONNEL',
      'MAGISTRAT A TITRE TEMPORAIRE',
      'MAGISTRAT RESERVISTE',
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
    for (let j = 0; j < listCont.length; j++) {
      const findFct = await models.HRFonctions.findOne({
        where: {
          label: listCont[j],
        },
      })
      if (findFct) await findFct.update({ position: 'Contractuel' })
    }

    const listCalculatriceIsActive = [
      'MAGISTRAT A TITRE TEMPORAIRE',
      'MAGISTRAT RESERVISTE',
      'MAGISTRAT HONORAIRE JURIDICTIONNEL',
      'MAGISTRAT HONORAIRE NON JURIDICTIONNEL',
      'GREFFIER RESERVISTE',
      'CHEF DE CABINET',
      'VACATAIRE',
      'CONTRACTUEL A',
      'CONTRACTUEL B',
      'CONTRACTUEL C',
      'CONTRACTUEL CB',
      'CONTRACTUEL CT',
      'CONTRACTUEL A JUSTICE DE PROXIMITE',
      'CONTRACTUEL B JUSTICE DE PROXIMITE',
      'CONTRACTUEL C JUSTICE DE PROXIMITE',
      'ASSISTANT DE JUSTICE',
      'ASSISTANT SPECIALISE',
      'JURISTE ASSISTANT',
      'ELEVE AVOCAT',
    ]
    for (let k = 0; k < listCalculatriceIsActive.length; k++) {
      const findFct = await models.HRFonctions.findOne({
        where: {
          label: listCalculatriceIsActive[k],
        },
      })
      if (findFct) await findFct.update({ calculatrice_is_active: true })
    }
  },
  down: (/*queryInterface , Sequelize*/) => {},
}
