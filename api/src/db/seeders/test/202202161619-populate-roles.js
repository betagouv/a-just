module.exports = {
  up: async (queryInterface, Sequelize, models) => {
    const findMag = await models.HRCategories.findOne({
      where: {
        label: 'Magistrat',
      },
      raw: true,
    })
    const findFon = await models.HRCategories.findOne({
      where: {
        label: 'Fonctionnaire',
      },
      raw: true,
    })
    const findCon = await models.HRCategories.findOne({
      where: {
        label: 'Contractuel',
      },
      raw: true,
    })

    if (findMag) {
      await models.HRFonctions.update(
        { category_id: findMag.id },
        { where: {} }
      )
    }

    if (findFon) {
      const list = [
        {
          label: 'Directeur des services de greffe judiciaires',
          code: 'DSGJ',
        },
        {
          label: 'Directeurs fonctionnels des services de greffe judiciaires',
          code: 'DF',
        },
        {
          label: 'Greffier',
          code: 'G',
        },
        {
          label: 'Greffier fonctionnel des services judiciaires',
          code: 'GFSJ',
        },
        {
          label: 'Greffier assistant du magistrat',
          code: 'GAM',
        },
        {
          label: 'Secrétaire administratif',
          code: 'SA',
        },
        {
          label: 'Adjoint administratif',
          code: 'AA',
        },
        {
          label: 'Agent technique',
          code: 'AT',
        },
      ]
      for (let i = 0; i < list.length; i++) {
        await models.HRFonctions.create({
          ...list[i],
          rank: i + 1,
          category_id: findFon.id,
        })
      }
    }

    if (findCon) {
      const list = [
        {
          label: 'Vacataires',
          code: 'Vacataires',
        },
        {
          label: 'Assistants spécialisés',
          code: 'Assistants spécialisés',
        },
        {
          label: 'Juristes assistants',
          code: 'Juristes assistants',
        },
        {
          label: 'Assistants de justice',
          code: 'Assistants de justice',
        },
        {
          label: 'Magistrat à titre temporaire',
          code: 'Magistrat à titre temporaire',
        },
        {
          label: 'Magistrat honoraire (MHFJ)',
          code: 'Magistrat honoraire (MHFJ)',
        },
        {
          label: 'Autres',
          code: 'Autres',
        },
      ]
      for (let i = 0; i < list.length; i++) {
        await models.HRFonctions.create({
          ...list[i],
          rank: i + 1,
          category_id: findCon.id,
        })
      }
    }
  },
  down: (/*queryInterface , Sequelize*/) => {},
}
