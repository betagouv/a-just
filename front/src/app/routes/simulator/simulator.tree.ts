const etpMag = 'etpMag'
const etpMagTitle = 'des ETPT magistrat'
const etpMagToDefine = ['un volume moyen de']

const realTimePerCase = 'realTimePerCase'
const realTimePerCaseTitle = 'du Temps moyen / Dossier'
const realTimePerCaseToDefine = ['un temps moyen par dossier de']

const totalIn = 'totalIn'
const totalInTitle = 'des entrées moyennes mensuelles'
const totalInToDefine = ['une valeur de', 'une variation de']

const totalOut = 'totalOut'
const totalOutTitle = 'des sorties moyennes mensuelles'
const totalOutToDefine = ['une valeur de', 'une variation de']

const lastStock = 'lastStock'
const lastStockTitle = 'du stock'
const lastStockToDefine = ['une valeur de', 'une variation de']

const realCoverage = 'realCoverage'
const realCoverageTitle = 'du Taux de Couverture'
const realCoverageToDefine = ['une valeur de (en %)']

const realDTESInMonths = 'realDTESInMonths'
const realDTESInMonthsTitle = 'du DTES'
const realDTESInMonthsToDefine = ['une valeur de (en mois)']

const tree = [
  {
    label: etpMag,
    popupTitle: etpMagTitle,
    toDefine: etpMagToDefine,
    toSimulate: [
      {
        locked: realTimePerCase,
        toDisplay: [totalIn, etpMag, realTimePerCase],
        toCalculate: [totalOut, lastStock, realCoverage, realDTESInMonths],
      },
      {
        locked: totalOut,
        toDisplay: [totalIn, totalOut, etpMag, realCoverage],
        toCalculate: [lastStock, realDTESInMonths, realTimePerCase],
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
            toDisplay: [totalIn, etpMag, realTimePerCase],
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
              realTimePerCase,
            ],
          },
        ],
      },

      {
        label: realTimePerCase,
        popupTitle: realTimePerCaseTitle,
        toDefine: realTimePerCaseToDefine,
        toSimulate: [
          {
            toDisplay: [totalIn, etpMag, realTimePerCase],
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
            toCalculate: [totalOut, lastStock, realCoverage, realTimePerCase],
          },
        ],
      },

      {
        label: lastStock,
        popupTitle: lastStockTitle,
        toDefine: lastStockToDefine,
        toSimulate: [
          {
            toDisplay: [totalIn, lastStock, etpMag, realTimePerCase],
            toCalculate: [totalOut, realCoverage, realDTESInMonths],
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
              realTimePerCase,
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
          realTimePerCase,
        ],
      },
      {
        locked: realTimePerCase,
        toDisplay: [totalIn, lastStock, realTimePerCase],
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
              realTimePerCase,
              realCoverage,
            ],
          },
          {
            locked: realTimePerCase,
            toDisplay: [totalIn, lastStock, realTimePerCase],
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
            toDisplay: [totalIn, lastStock, etpMag, realTimePerCase],
            toCalculate: [totalOut, realDTESInMonths, realCoverage],
          },
        ],
      },

      {
        label: realTimePerCase,
        popupTitle: realTimePerCaseTitle,
        toDefine: realTimePerCaseToDefine,
        toSimulate: [
          {
            locked: '',
            toDisplay: [totalIn, lastStock, etpMag, realTimePerCase],
            toCalculate: [totalOut, realDTESInMonths, realCoverage],
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
              realTimePerCase,
            ],
          },
          {
            locked: realTimePerCase,
            toDisplay: [totalIn, realCoverage, realTimePerCase],
            toCalculate: [totalOut, lastStock, etpMag, realDTESInMonths],
          },
        ],
      },
      {
        locked: totalOut,
        toDisplay: [totalOut, etpMag, realCoverage, realTimePerCase],
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
              realTimePerCase,
            ],
          },
          {
            locked: realTimePerCase,
            toDisplay: [totalIn, realCoverage, realTimePerCase],
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
              realTimePerCase,
            ],
          },
        ],
      },

      {
        label: realTimePerCase,
        popupTitle: realTimePerCaseTitle,
        toDefine: realTimePerCaseToDefine,
        toSimulate: [
          {
            locked: '',
            toDisplay: [totalIn, realCoverage, realTimePerCase],
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
            toCalculate: [totalOut, lastStock, realCoverage, realTimePerCase],
          },
          {
            locked: realTimePerCase,
            toDisplay: [totalIn, realDTESInMonths, realTimePerCase],
            toCalculate: [totalOut, lastStock, etpMag, realCoverage],
          },
        ],
      },
      {
        locked: totalOut,
        toDisplay: [totalOut, etpMag, realDTESInMonths, realTimePerCase],
        toCalculate: [totalIn, lastStock, realCoverage],
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
            toCalculate: [totalOut, lastStock, realCoverage, realTimePerCase],
          },
          {
            locked: realTimePerCase,
            toDisplay: [totalIn, realDTESInMonths, realTimePerCase],
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
            toCalculate: [totalOut, lastStock, realCoverage, realTimePerCase],
          },
        ],
      },

      {
        label: realTimePerCase,
        popupTitle: realTimePerCaseTitle,
        toDefine: realTimePerCaseToDefine,
        toSimulate: [
          {
            locked: '',
            toDisplay: [totalIn, realDTESInMonths, realTimePerCase],
            toCalculate: [totalOut, lastStock, realCoverage, etpMag],
          },
        ],
      },
    ],
  },

  {
    label: realTimePerCase,
    popupTitle: realTimePerCaseTitle,
    toDefine: realTimePerCaseToDefine,
    toSimulate: [
      {
        locked: etpMag,
        toDisplay: [totalIn, etpMag, realTimePerCase],
        toCalculate: [totalOut, lastStock, realCoverage, realDTESInMonths],
      },
      {
        locked: totalOut,
        toDisplay: [totalIn, totalOut, realCoverage, realTimePerCase],
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
            toDisplay: [totalIn, totalOut, realTimePerCase],
            toCalculate: [lastStock, etpMag, realCoverage, realDTESInMonths],
          },
          {
            locked: etpMag,
            toDisplay: [totalIn, etpMag, realTimePerCase],
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
            toDisplay: [totalIn, totalOut, realTimePerCase],
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
            toDisplay: [totalIn, etpMag, realTimePerCase],
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
            toDisplay: [totalIn, realCoverage, realTimePerCase],
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
            locked: '',
            toDisplay: [totalIn, realDTESInMonths, realTimePerCase],
            toCalculate: [totalOut, lastStock, realCoverage, etpMag],
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
          realTimePerCase,
        ],
      },
      {
        locked: realTimePerCase,
        toDisplay: [totalIn, totalOut, realTimePerCase],
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
              realTimePerCase,
            ],
          },
          {
            locked: realTimePerCase,
            toDisplay: [totalIn, totalOut, realTimePerCase],
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
              realTimePerCase,
            ],
          },
        ],
      },

      {
        label: realTimePerCase,
        popupTitle: realTimePerCaseTitle,
        toDefine: realTimePerCaseToDefine,
        toSimulate: [
          {
            locked: '',
            toDisplay: [totalIn, totalOut, realTimePerCase],
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
        toDisplay: [totalIn, totalOut, etpMag, realTimePerCase],
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
              realTimePerCase,
            ],
          },
          {
            locked: realTimePerCase,
            toDisplay: [totalIn, totalOut, realTimePerCase],
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
              realTimePerCase,
              realCoverage,
            ],
          },
          {
            locked: realTimePerCase,
            toDisplay: [totalIn, lastStock, realTimePerCase],
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
            toDisplay: [totalIn, etpMag, realTimePerCase],
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
              realTimePerCase,
            ],
          },

          {
            locked: realTimePerCase,
            toDisplay: [totalIn, realCoverage, realTimePerCase],
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
            toCalculate: [totalOut, lastStock, realCoverage, realTimePerCase],
          },

          {
            locked: realTimePerCase,
            toDisplay: [totalIn, realDTESInMonths, realTimePerCase],
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
            toCalculate: [totalOut, lastStock, realCoverage, realTimePerCase],
          },

          {
            locked: realTimePerCase,
            toDisplay: [totalIn, realDTESInMonths, realTimePerCase],
            toCalculate: [totalOut, lastStock, realCoverage, etpMag],
          },
        ],
      },

      {
        label: realTimePerCase,
        popupTitle: realTimePerCaseTitle,
        toDefine: realTimePerCaseToDefine,
        toSimulate: [
          {
            locked: totalOut,
            toDisplay: [totalIn, totalOut, realTimePerCase],
            toCalculate: [lastStock, etpMag, realCoverage, realDTESInMonths],
          },

          {
            locked: etpMag,
            toDisplay: [totalIn, etpMag, realTimePerCase],
            toCalculate: [totalOut, lastStock, realCoverage, realDTESInMonths],
          },
        ],
      },
    ],
  },
]
export { tree }
