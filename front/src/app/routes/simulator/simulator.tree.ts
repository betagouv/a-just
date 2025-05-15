/**
 * Etp magistrat field name
 */
const etpMag = 'etpMag';
/**
 * Etp magistrat text 1
 */
const etpMagTitle = 'des ETPT siège';
/**
 * Etp magistrat unit
 */
const etpMagToDefine = ['un volume moyen de'];

/**
 * Etp fonctionnaire field name
 */
const etpFon = 'etpFon';
/**
 * Etp fonctionnaire text 1
 */
const etpFonTitle = 'des ETPT greffe';
/**
 * Etp fonctionnaire unit
 */
const etpFonToDefine = ['un volume moyen de'];

/**
 * Temps moyen par dossier field name
 */
const magRealTimePerCase = 'magRealTimePerCase';
/**
 * Temps moyen par dossier text 1
 */
const magRealTimePerCaseTitle = 'du Temps moyen / Dossier';
/**
 * Temps moyen par dossier field name
 */
const magRealTimePerCaseToDefine = [
  'un temps moyen par dossier de',
  'une variation de',
];

/**
 * Entrée field name
 */
const totalIn = 'totalIn';
/**
 * Entrée text 1
 */
const totalInTitle = 'des entrées moyennes mensuelles';
/**
 * Entrée unit
 */
const totalInToDefine = ['une valeur de', 'une variation de'];

/**
 * Sorties field name
 */
const totalOut = 'totalOut';
/**
 * Sorties text 1
 */
const totalOutTitle = 'des sorties moyennes mensuelles';
/**
 * Sorties unit
 */
const totalOutToDefine = ['une valeur de', 'une variation de'];

/**
 * Stock field name
 */
const lastStock = 'lastStock';
/**
 * Stock text 1
 */
const lastStockTitle = 'du stock';
/**
 * Stock unit
 */
const lastStockToDefine = ['une valeur de', 'une variation de'];

/**
 * Taux de couverture field name
 */
const realCoverage = 'realCoverage';
/**
 * Taux de couverture text 1
 */
const realCoverageTitle = 'du Taux de Couverture';
/**
 * Taux de couverture unit
 */
const realCoverageToDefine = ['une valeur de (en %)'];

/**
 * DTES field name
 */
const realDTESInMonths = 'realDTESInMonths';
/**
 * DTES text 1
 */
const realDTESInMonthsTitle = 'du DTES';
/**
 * DTES unit
 */
const realDTESInMonthsToDefine = ['une valeur de (en mois)'];

/**
 * Arbre de décision de simulation
 */
const tree = [
  {
    label: etpMag,
    popupTitle: etpMagTitle,
    toDefine: etpMagToDefine,
    toSimulate: [
      {
        locked: magRealTimePerCase,
        toDisplay: [totalIn, etpMag, magRealTimePerCase],
        toCalculate: [totalOut, lastStock, realCoverage, realDTESInMonths],
      },
      {
        locked: totalOut,
        toDisplay: [totalIn, totalOut, etpMag, realCoverage],
        toCalculate: [lastStock, realDTESInMonths, magRealTimePerCase],
      },
    ],
    toAjust: [
      {
        label: totalIn,
        popupTitle: totalInTitle,
        toDefine: totalInToDefine,
        toSimulate: [
          {
            locked: '',
            toDisplay: [totalIn, etpMag, magRealTimePerCase],
            toCalculate: [totalOut, lastStock, realCoverage, realDTESInMonths],
          },
        ],
      },

      {
        label: totalOut,
        popupTitle: totalOutTitle,
        toDefine: totalOutToDefine,
        toSimulate: [
          {
            locked: '',
            toDisplay: [totalIn, totalOut, etpMag],
            toCalculate: [
              lastStock,
              realCoverage,
              realDTESInMonths,
              magRealTimePerCase,
            ],
          },
        ],
      },

      {
        label: magRealTimePerCase,
        popupTitle: magRealTimePerCaseTitle,
        toDefine: magRealTimePerCaseToDefine,
        toSimulate: [
          {
            toDisplay: [totalIn, etpMag, magRealTimePerCase],
            toCalculate: [totalOut, lastStock, realCoverage, realDTESInMonths],
          },
        ],
      },

      {
        label: realDTESInMonths,
        popupTitle: realDTESInMonthsTitle,
        toDefine: realDTESInMonthsToDefine,
        toSimulate: [
          {
            toDisplay: [totalIn, etpMag, realDTESInMonths],
            toCalculate: [
              totalOut,
              lastStock,
              realCoverage,
              magRealTimePerCase,
            ],
          },
        ],
      },

      {
        label: lastStock,
        popupTitle: lastStockTitle,
        toDefine: lastStockToDefine,
        toSimulate: [
          {
            toDisplay: [totalIn, lastStock, etpMag],
            toCalculate: [
              totalOut,
              realCoverage,
              realDTESInMonths,
              magRealTimePerCase,
            ],
          },
        ],
      },

      {
        label: realCoverage,
        popupTitle: realCoverageTitle,
        toDefine: realCoverageToDefine,
        toSimulate: [
          {
            toDisplay: [totalIn, etpMag, realCoverage],
            toCalculate: [
              totalOut,
              lastStock,
              realDTESInMonths,
              magRealTimePerCase,
            ],
          },
        ],
      },
    ],
  },
  {
    label: lastStock,
    popupTitle: lastStockTitle,
    toDefine: lastStockToDefine,
    toSimulate: [
      {
        locked: etpMag,
        toDisplay: [totalIn, lastStock, etpMag],
        toCalculate: [
          totalOut,
          realCoverage,
          realDTESInMonths,
          magRealTimePerCase,
        ],
      },
      {
        locked: magRealTimePerCase,
        toDisplay: [totalIn, lastStock, magRealTimePerCase],
        toCalculate: [totalOut, etpMag, realCoverage, realDTESInMonths],
      },
    ],
    toAjust: [
      {
        label: totalIn,
        popupTitle: totalInTitle,
        toDefine: totalInToDefine,
        toSimulate: [
          {
            locked: etpMag,
            toDisplay: [totalIn, lastStock, etpMag],
            toCalculate: [
              totalOut,
              realDTESInMonths,
              magRealTimePerCase,
              realCoverage,
            ],
          },
          {
            locked: magRealTimePerCase,
            toDisplay: [totalIn, lastStock, magRealTimePerCase],
            toCalculate: [totalOut, realDTESInMonths, etpMag, realCoverage],
          },
        ],
      },

      {
        label: etpMag,
        popupTitle: etpMagTitle,
        toDefine: etpMagToDefine,
        toSimulate: [
          {
            locked: '',
            toDisplay: [totalIn, lastStock, etpMag],
            toCalculate: [
              totalOut,
              realCoverage,
              realDTESInMonths,
              magRealTimePerCase,
            ],
          },
        ],
      },

      {
        label: magRealTimePerCase,
        popupTitle: magRealTimePerCaseTitle,
        toDefine: magRealTimePerCaseToDefine,
        toSimulate: [
          {
            locked: '',
            toDisplay: [totalIn, lastStock, magRealTimePerCase],
            toCalculate: [totalOut, realCoverage, realDTESInMonths, etpMag],
          },
        ],
      },
    ],
  },

  {
    label: realCoverage,
    popupTitle: realCoverageTitle,
    toDefine: realCoverageToDefine,
    toSimulate: [
      {
        locked: totalIn,
        secondLocked: [
          {
            locked: etpMag,
            toDisplay: [totalIn, etpMag, realCoverage],
            toCalculate: [
              totalOut,
              lastStock,
              realDTESInMonths,
              magRealTimePerCase,
            ],
          },
          {
            locked: magRealTimePerCase,
            toDisplay: [totalIn, realCoverage, magRealTimePerCase],
            toCalculate: [totalOut, lastStock, etpMag, realDTESInMonths],
          },
        ],
      },
      {
        locked: totalOut,
        toDisplay: [totalOut, etpMag, realCoverage, magRealTimePerCase],
        toCalculate: [totalIn, lastStock, realDTESInMonths],
      },
    ],
    toAjust: [
      {
        label: totalIn,
        popupTitle: totalInTitle,
        toDefine: totalInToDefine,
        toSimulate: [
          {
            locked: etpMag,
            toDisplay: [totalIn, etpMag, realCoverage],
            toCalculate: [
              totalOut,
              lastStock,
              realDTESInMonths,
              magRealTimePerCase,
            ],
          },
          {
            locked: magRealTimePerCase,
            toDisplay: [totalIn, realCoverage, magRealTimePerCase],
            toCalculate: [totalOut, lastStock, etpMag, realDTESInMonths],
          },
        ],
      },

      {
        label: etpMag,
        popupTitle: etpMagTitle,
        toDefine: etpMagToDefine,
        toSimulate: [
          {
            locked: '',
            toDisplay: [totalIn, etpMag, realCoverage],
            toCalculate: [
              totalOut,
              lastStock,
              realDTESInMonths,
              magRealTimePerCase,
            ],
          },
        ],
      },

      {
        label: magRealTimePerCase,
        popupTitle: magRealTimePerCaseTitle,
        toDefine: magRealTimePerCaseToDefine,
        toSimulate: [
          {
            locked: '',
            toDisplay: [totalIn, realCoverage, magRealTimePerCase],
            toCalculate: [totalOut, lastStock, etpMag, realDTESInMonths],
          },
        ],
      },
    ],
  },

  {
    label: realDTESInMonths,
    popupTitle: realDTESInMonthsTitle,
    toDefine: realDTESInMonthsToDefine,
    toSimulate: [
      {
        locked: totalIn,
        secondLocked: [
          {
            locked: etpMag,
            toDisplay: [totalIn, etpMag, realDTESInMonths],
            toCalculate: [
              totalOut,
              lastStock,
              realCoverage,
              magRealTimePerCase,
            ],
          },
          {
            locked: magRealTimePerCase,
            toDisplay: [totalIn, realDTESInMonths, magRealTimePerCase],
            toCalculate: [totalOut, lastStock, etpMag, realCoverage],
          },
        ],
      },
      {
        locked: totalOut,
        toDisplay: [totalOut, etpMag, realDTESInMonths, magRealTimePerCase],
        toCalculate: [lastStock, totalIn, realCoverage],
      },
    ],
    toAjust: [
      {
        label: totalIn,
        popupTitle: totalInTitle,
        toDefine: totalInToDefine,
        toSimulate: [
          {
            locked: etpMag,
            toDisplay: [totalIn, etpMag, realDTESInMonths],
            toCalculate: [
              totalOut,
              lastStock,
              realCoverage,
              magRealTimePerCase,
            ],
          },
          {
            locked: magRealTimePerCase,
            toDisplay: [totalIn, realDTESInMonths, magRealTimePerCase],
            toCalculate: [totalOut, lastStock, realCoverage, etpMag],
          },
        ],
      },

      {
        label: etpMag,
        popupTitle: etpMagTitle,
        toDefine: etpMagToDefine,
        toSimulate: [
          {
            locked: '',
            toDisplay: [totalIn, etpMag, realDTESInMonths],
            toCalculate: [
              totalOut,
              lastStock,
              realCoverage,
              magRealTimePerCase,
            ],
          },
        ],
      },

      {
        label: magRealTimePerCase,
        popupTitle: magRealTimePerCaseTitle,
        toDefine: magRealTimePerCaseToDefine,
        toSimulate: [
          {
            locked: '',
            toDisplay: [totalIn, realDTESInMonths, magRealTimePerCase],
            toCalculate: [totalOut, lastStock, realCoverage, etpMag],
          },
        ],
      },
    ],
  },

  {
    label: magRealTimePerCase,
    popupTitle: magRealTimePerCaseTitle,
    toDefine: magRealTimePerCaseToDefine,
    toSimulate: [
      {
        locked: etpMag,
        toDisplay: [totalIn, etpMag, magRealTimePerCase],
        toCalculate: [totalOut, lastStock, realCoverage, realDTESInMonths],
      },
      {
        locked: totalOut,
        toDisplay: [totalIn, totalOut, realCoverage, magRealTimePerCase],
        toCalculate: [lastStock, etpMag, realDTESInMonths],
      },
    ],
    toAjust: [
      {
        label: totalIn,
        popupTitle: totalInTitle,
        toDefine: totalInToDefine,
        toSimulate: [
          {
            locked: totalOut,
            toDisplay: [totalIn, totalOut, magRealTimePerCase],
            toCalculate: [lastStock, etpMag, realCoverage, realDTESInMonths],
          },
          {
            locked: etpMag,
            toDisplay: [totalIn, etpMag, magRealTimePerCase],
            toCalculate: [totalOut, lastStock, realCoverage, realDTESInMonths],
          },
        ],
      },

      {
        label: totalOut,
        popupTitle: totalOutTitle,
        toDefine: totalOutToDefine,
        toSimulate: [
          {
            locked: '',
            toDisplay: [totalIn, totalOut, magRealTimePerCase],
            toCalculate: [lastStock, etpMag, realCoverage, realDTESInMonths],
          },
        ],
      },

      {
        label: etpMag,
        popupTitle: etpMagTitle,
        toDefine: etpMagToDefine,
        toSimulate: [
          {
            locked: '',
            toDisplay: [totalIn, etpMag, magRealTimePerCase],
            toCalculate: [totalOut, lastStock, realCoverage, realDTESInMonths],
          },
        ],
      },
      {
        label: realCoverage,
        popupTitle: realCoverageTitle,
        toDefine: realCoverageToDefine,
        toSimulate: [
          {
            locked: '',
            toDisplay: [totalIn, realCoverage, magRealTimePerCase],
            toCalculate: [totalOut, lastStock, etpMag, realDTESInMonths],
          },
        ],
      },

      {
        label: lastStock,
        popupTitle: lastStockTitle,
        toDefine: lastStockToDefine,
        toSimulate: [
          {
            locked: '',
            toDisplay: [totalIn, magRealTimePerCase, lastStock],
            toCalculate: [totalOut, realDTESInMonths, realCoverage, etpMag],
          },
        ],
      },
      {
        label: realDTESInMonths,
        popupTitle: realDTESInMonthsTitle,
        toDefine: realDTESInMonthsToDefine,
        toSimulate: [
          {
            locked: '',
            toDisplay: [totalIn, realDTESInMonths, magRealTimePerCase],
            toCalculate: [totalOut, lastStock, etpMag, realCoverage],
          },
        ],
      },
    ],
  },

  {
    label: totalOut,
    popupTitle: totalOutTitle,
    toDefine: totalOutToDefine,
    toSimulate: [
      {
        locked: etpMag,
        toDisplay: [totalIn, totalOut, etpMag],
        toCalculate: [
          lastStock,
          realCoverage,
          realDTESInMonths,
          magRealTimePerCase,
        ],
      },
      {
        locked: magRealTimePerCase,
        toDisplay: [totalIn, totalOut, magRealTimePerCase],
        toCalculate: [lastStock, etpMag, realCoverage, realDTESInMonths],
      },
    ],
    toAjust: [
      {
        label: totalIn,
        popupTitle: totalInTitle,
        toDefine: totalInToDefine,
        toSimulate: [
          {
            locked: etpMag,
            toDisplay: [totalIn, totalOut, etpMag],
            toCalculate: [
              lastStock,
              realCoverage,
              realDTESInMonths,
              magRealTimePerCase,
            ],
          },
          {
            locked: magRealTimePerCase,
            toDisplay: [totalIn, totalOut, magRealTimePerCase],
            toCalculate: [lastStock, etpMag, realCoverage, realDTESInMonths],
          },
        ],
      },

      {
        label: etpMag,
        popupTitle: etpMagTitle,
        toDefine: etpMagToDefine,
        toSimulate: [
          {
            locked: '',
            toDisplay: [totalIn, totalOut, etpMag],
            toCalculate: [
              lastStock,
              realCoverage,
              realDTESInMonths,
              magRealTimePerCase,
            ],
          },
        ],
      },

      {
        label: magRealTimePerCase,
        popupTitle: magRealTimePerCaseTitle,
        toDefine: magRealTimePerCaseToDefine,
        toSimulate: [
          {
            locked: '',
            toDisplay: [totalIn, totalOut, magRealTimePerCase],
            toCalculate: [lastStock, etpMag, realCoverage, realDTESInMonths],
          },
        ],
      },
    ],
  },

  {
    label: totalIn,
    popupTitle: totalInTitle,
    toDefine: totalInToDefine,
    toSimulate: [
      {
        toDisplay: [totalIn, totalOut, etpMag, magRealTimePerCase],
        toCalculate: [lastStock, realCoverage, realDTESInMonths],
      },
    ],
    toAjust: [
      {
        label: totalOut,
        popupTitle: totalOutTitle,
        toDefine: totalOutToDefine,
        toSimulate: [
          {
            locked: etpMag,
            toDisplay: [totalIn, totalOut, etpMag],
            toCalculate: [
              lastStock,
              realCoverage,
              realDTESInMonths,
              magRealTimePerCase,
            ],
          },
          {
            locked: magRealTimePerCase,
            toDisplay: [totalIn, totalOut, magRealTimePerCase],
            toCalculate: [lastStock, etpMag, realCoverage, realDTESInMonths],
          },
        ],
      },

      {
        label: lastStock,
        popupTitle: lastStockTitle,
        toDefine: lastStockToDefine,
        toSimulate: [
          {
            locked: etpMag,
            toDisplay: [totalIn, lastStock, etpMag],
            toCalculate: [
              totalOut,
              realDTESInMonths,
              magRealTimePerCase,
              realCoverage,
            ],
          },
          {
            locked: magRealTimePerCase,
            toDisplay: [totalIn, lastStock, magRealTimePerCase],
            toCalculate: [totalOut, etpMag, realCoverage, realDTESInMonths],
          },
        ],
      },

      {
        label: etpMag,
        popupTitle: etpMagTitle,
        toDefine: etpMagToDefine,
        toSimulate: [
          {
            locked: '',
            toDisplay: [totalIn, etpMag, magRealTimePerCase],
            toCalculate: [totalOut, lastStock, realCoverage, realDTESInMonths],
          },
        ],
      },

      {
        label: realCoverage,
        popupTitle: realCoverageTitle,
        toDefine: realCoverageToDefine,
        toSimulate: [
          {
            locked: etpMag,
            toDisplay: [totalIn, etpMag, realCoverage],
            toCalculate: [
              totalOut,
              lastStock,
              realDTESInMonths,
              magRealTimePerCase,
            ],
          },

          {
            locked: magRealTimePerCase,
            toDisplay: [totalIn, realCoverage, magRealTimePerCase],
            toCalculate: [totalOut, lastStock, etpMag, realDTESInMonths],
          },
        ],
      },

      {
        label: realDTESInMonths,
        popupTitle: realDTESInMonthsTitle,
        toDefine: realDTESInMonthsToDefine,
        toSimulate: [
          {
            locked: etpMag,
            toDisplay: [totalIn, etpMag, realDTESInMonths],
            toCalculate: [
              totalOut,
              lastStock,
              realCoverage,
              magRealTimePerCase,
            ],
          },

          {
            locked: magRealTimePerCase,
            toDisplay: [totalIn, realDTESInMonths, magRealTimePerCase],
            toCalculate: [totalOut, lastStock, realCoverage, etpMag],
          },
        ],
      },

      {
        label: realDTESInMonths,
        popupTitle: realDTESInMonthsTitle,
        toDefine: realDTESInMonthsToDefine,
        toSimulate: [
          {
            locked: etpMag,
            toDisplay: [totalIn, etpMag, realDTESInMonths],
            toCalculate: [
              totalOut,
              lastStock,
              realCoverage,
              magRealTimePerCase,
            ],
          },

          {
            locked: magRealTimePerCase,
            toDisplay: [totalIn, realDTESInMonths, magRealTimePerCase],
            toCalculate: [totalOut, lastStock, realCoverage, etpMag],
          },
        ],
      },

      {
        label: magRealTimePerCase,
        popupTitle: magRealTimePerCaseTitle,
        toDefine: magRealTimePerCaseToDefine,
        toSimulate: [
          {
            locked: totalOut,
            toDisplay: [totalIn, totalOut, magRealTimePerCase],
            toCalculate: [lastStock, etpMag, realCoverage, realDTESInMonths],
          },

          {
            locked: etpMag,
            toDisplay: [totalIn, etpMag, magRealTimePerCase],
            toCalculate: [totalOut, lastStock, realCoverage, realDTESInMonths],
          },
        ],
      },
    ],
  },
];
export { tree, etpFon, etpFonTitle, etpFonToDefine };
