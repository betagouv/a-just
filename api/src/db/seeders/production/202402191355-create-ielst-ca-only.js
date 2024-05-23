import config from 'config';

module.exports = {
  up: async (queryInterface, Sequelize) => {

    const CATable = [
      {
        "I_ELST": 100014,
        "Nom": "CA Agen",
        "Latitude": 44.1990875,
        "Longitude": 0.6165048,
        "Population": "696742"
      },
      {
        "I_ELST": 100001,
        "Nom": "CA Aix-en-Provence",
        "Latitude": 43.5288948,
        "Longitude": 5.4472993,
        "Population": "4378412"
      },
      {
        "I_ELST": 100004,
        "Nom": "CA Bastia",
        "Latitude": 42.694664,
        "Longitude": 9.4401796,
        "Population": "340440"
      },
      {
        "I_ELST": 100024,
        "Nom": "CA Chambéry",
        "Latitude": 45.8786901,
        "Longitude": 5.7485701,
        "Population": "1262528"
      },
      {
        "I_ELST": 100008,
        "Nom": "CA Toulouse",
        "Latitude": 43.593938,
        "Longitude": 1.4423204,
        "Population": "2203839"
      },
      {
        "I_ELST": 100002,
        "Nom": "CA Caen",
        "Latitude": 49.1793972,
        "Longitude": -0.3684578,
        "Population": "1469892"
      },
      {
        "I_ELST": 100007,
        "Nom": "CA Nîmes",
        "Latitude": 43.8354186,
        "Longitude": 4.3579015,
        "Population": "1714788"
      },
      {
        "I_ELST": 100028,
        "Nom": "CA Amiens",
        "Latitude": 49.8927065,
        "Longitude": 2.2994183,
        "Population": "1931323"
      },
      {
        "I_ELST": 100015,
        "Nom": "CA Angers",
        "Latitude": 47.4706655,
        "Longitude": -0.5460712,
        "Population": "1691747"
      },
      {
        "I_ELST": 100009,
        "Nom": "CA Bordeaux",
        "Latitude": 44.835437,
        "Longitude": -0.5843199,
        "Population": "2388987"
      },
      {
        "I_ELST": 100019,
        "Nom": "CA Douai",
        "Latitude": 50.3673422,
        "Longitude": 3.0766307,
        "Population": "4073624"
      },
      {
        "I_ELST": 100020,
        "Nom": "CA Riom",
        "Latitude": 45.8950049,
        "Longitude": 3.1149571,
        "Population": "1370389"
      },
      {
        "I_ELST": 914815,
        "Nom": "CA Paris",
        "Latitude": 48.8513215,
        "Longitude": 2.3382075,
        "Population": "8276013"
      },
      {
        "I_ELST": 100017,
        "Nom": "CA Nancy",
        "Latitude": 48.6947548,
        "Longitude": 6.1831368,
        "Population": "1282342"
      },
      {
        "I_ELST": 100031,
        "Nom": "CA Basse-Terre",
        "Latitude": 15.99208,
        "Longitude": -61.7283038,
        "Population": "384239"
      },
      {
        "I_ELST": 100021,
        "Nom": "CA Pau",
        "Latitude": 43.2982481,
        "Longitude": -0.3743639,
        "Population": "1325878"
      },
      {
        "I_ELST": 100006,
        "Nom": "CA Besançon",
        "Latitude": 47.2365311,
        "Longitude": 6.0204624,
        "Population": "1179804"
      },
      {
        "I_ELST": 100010,
        "Nom": "CA Montpellier",
        "Latitude": 43.6115119,
        "Longitude": 3.8702829,
        "Population": "2309267"
      },
      {
        "I_ELST": 100013,
        "Nom": "CA Orleans",
        "Latitude": 47.904901,
        "Longitude": 1.9032916,
        "Population": "1619983"
      },
      {
        "I_ELST": 100023,
        "Nom": "CA Lyon",
        "Latitude": 45.7619461,
        "Longitude": 4.8254371,
        "Population": "3293813"
      },
      {
        "I_ELST": 100003,
        "Nom": "CA Bourges",
        "Latitude": 47.0847608,
        "Longitude": 2.3898982,
        "Population": "726074"
      },
      {
        "I_ELST": 100011,
        "Nom": "CA Rennes",
        "Latitude": 48.1121389,
        "Longitude": -1.6779443,
        "Population": "4784126"
      },
      {
        "I_ELST": 100030,
        "Nom": "CA Limoges",
        "Latitude": 45.8304524,
        "Longitude": 1.2524436,
        "Population": "729049"
      },
      {
        "I_ELST": 943116,
        "Nom": "CA Cayenne",
        "Latitude": 4.9386534,
        "Longitude": -52.3372745,
        "Population": "281678"
      },
      {
        "I_ELST": 100005,
        "Nom": "CA Dijon",
        "Latitude": 47.3196476,
        "Longitude": 5.0388578,
        "Population": "1258129"
      },
      {
        "I_ELST": 100027,
        "Nom": "CA Versailles",
        "Latitude": 48.8065605,
        "Longitude": 2.1240405,
        "Population": "4753813"
      },
      {
        "I_ELST": 100032,
        "Nom": "CA Fort-de-France",
        "Latitude": 14.5843669,
        "Longitude": -61.0086114,
        "Population": "364508"
      },
      {
        "I_ELST": 100012,
        "Nom": "CA Grenoble",
        "Latitude": 45.1917318,
        "Longitude": 5.7089432,
        "Population": "1929148"
      },
      {
        "I_ELST": 100018,
        "Nom": "CA Metz",
        "Latitude": 47.1277277,
        "Longitude": 3.3025632,
        "Population": "1046543"
      },
      {
        "I_ELST": 100022,
        "Nom": "CA Colmar",
        "Latitude": 48.0714366,
        "Longitude": 7.3482971,
        "Population": "1907143"
      },
      {
        "I_ELST": 100036,
        "Nom": "CA Papeete",
        "Latitude": -17.5444016,
        "Longitude": -149.5744737,
        "Population": ""
      },
      {
        "I_ELST": 100026,
        "Nom": "CA Rouen",
        "Latitude": 49.433493,
        "Longitude": 1.1218289,
        "Population": "1855140"
      },
      {
        "I_ELST": 100016,
        "Nom": "CA Reims",
        "Latitude": 49.2452078,
        "Longitude": 4.0341129,
        "Population": "1147679"
      },
      {
        "I_ELST": 100029,
        "Nom": "CA Poitiers",
        "Latitude": 46.5837666,
        "Longitude": 0.3352164,
        "Population": "2150113"
      },
      {
        "I_ELST": 100037,
        "Nom": "CA Nouméa",
        "Latitude": -21.1876473,
        "Longitude": 165.2532532,
        "Population": ""
      },
      {
        "I_ELST": 100033,
        "Nom": "CA Saint-Denis-de-La-Réunion",
        "Latitude": -12.7631419,
        "Longitude": 45.2219673,
        "Population": "861210"
      }
    ]

    // ONLY FOR CA
    if (Number(config.juridictionType) === 1) {
      await models.TJ.destroy({
        where: {},
        truncate: true,
        force: true,
      })

      CATable.map(async CA => {
        await models.TJ.addIELST(CA.I_ELST, CA.Nom.toUpperCase(), CA.Latitude, CA.Longitude, CA.Population)
      })
    }
  },
  down: async (/*queryInterface /*, Sequelize*/) => {
    return
  },
}