const etpMag = 'etpMag'
const etpMagTitle = 'des etpMag'
const etpMagToDefine = ['un volume de', 'une variation de']

const realTimePerCase = 'realTimePerCase'
const realTimePerCaseTitle = 'du Temps moyen / Dossier'
const realTimePerCaseToDefine = ['un temps moyen par dossier de (en H:MM)']

const totalIn = 'totalIn'
const totalInTitle = 'des Entrées mensuelles moyennes'
const totalInToDefine = ['une valeur de', 'une variation de']

const totalOut = 'totalOut'
const totalOutTitle = 'des Sorties mensuelles moyennes'
const totalOutToDefine = ['une valeur de', 'une variation de']

const lastStock = 'lastStock'
const lastStockTitle = 'des Stocks'
const lastStockToDefine = ['une valeur de', 'une variation de']

const realCoverage = 'realCoverage'
const realCoverageTitle = 'du Taux de Couverture'
const realCoverageToDefine = ['une valeur de (en %)']

const realDTESInMonths = 'realDTESInMonths'
const realDTESInMonthsTitle = 'du DTES'
const realDTESInMonthsToDefine = ['une valeur de (en mois)', 'une variation de']

const tree = [
    {
        label: etpMag,
        popupTitle: etpMagTitle,
        toDefine: etpMagToDefine,
        toSimulate: [
            {
                locked: realTimePerCase,
                toDisplay: [totalIn, etpMag, realTimePerCase],
                toCalculate: [
                    totalOut,
                    lastStock,
                    realCoverage,
                    realDTESInMonths,
                ],
            },
            {
                locked: totalOut,
                toDisplay: [totalIn, totalOut, lastStock, etpMag],
                toCalculate: [realCoverage, realDTESInMonths, realTimePerCase],
            },
        ],
        toAjust: [
            {
                label: totalIn,
                popupTitle: totalInTitle,
                toDefine: totalInToDefine,
                toSimulate: {
                    toDisplay: [totalIn, etpMag, realTimePerCase],
                    toCalculate: [
                        {
                            label: totalOut,
                            fct: (param: number) => {
                                return param
                            },
                        },
                        {
                            label: lastStock,
                            fct: (param: number) => {
                                return param
                            },
                        },
                        {
                            label: realCoverage,
                            fct: (param: number) => {
                                return param
                            },
                        },
                        {
                            label: realDTESInMonths,
                            fct: (param: number) => {
                                return param
                            },
                        },
                    ],
                },
            },

            {
                label: totalOut,
                popupTitle: totalOutTitle,
                toDefine: totalOutToDefine,
                toSimulate: {
                    toDisplay: [totalIn, totalOut, etpMag],
                    toCalculate: [
                        {
                            label: totalIn,
                            fct: (param: number) => {
                                return param
                            },
                        },
                        {
                            label: totalOut,
                            fct: (param: number) => {
                                return param
                            },
                        },
                        {
                            label: etpMag,
                            fct: (param: number) => {
                                return param
                            },
                        },
                    ],
                },
            },

            {
                label: realTimePerCase,
                popupTitle: realTimePerCaseTitle,
                toDefine: realTimePerCaseToDefine,
                toSimulate: {
                    toDisplay: [totalIn, etpMag, realTimePerCase],
                    toCalculate: [
                        {
                            label: totalOut,
                            fct: (param: number) => {
                                return param
                            },
                        },
                        {
                            label: lastStock,
                            fct: (param: number) => {
                                return param
                            },
                        },
                        {
                            label: realCoverage,
                            fct: (param: number) => {
                                return param
                            },
                        },
                        {
                            label: realDTESInMonths,
                            fct: (param: number) => {
                                return param
                            },
                        },
                    ],
                },
            },

            {
                label: realDTESInMonths,
                popupTitle: realDTESInMonthsTitle,
                toDefine: realDTESInMonthsToDefine,
                toSimulate: {
                    toDisplay: [totalIn, etpMag, realDTESInMonths],
                    toCalculate: [
                        {
                            label: totalOut,
                            fct: (param: number) => {
                                return param
                            },
                        },
                        {
                            label: lastStock,
                            fct: (param: number) => {
                                return param
                            },
                        },
                        {
                            label: realCoverage,
                            fct: (param: number) => {
                                return param
                            },
                        },
                        {
                            label: realTimePerCase,
                            fct: (param: number) => {
                                return param
                            },
                        },
                    ],
                },
            },

            {
                label: lastStock,
                popupTitle: lastStockTitle,
                toDefine: lastStockToDefine,
                toSimulate: {
                    toDisplay: [totalIn, lastStock, etpMag, realTimePerCase],
                    toCalculate: [
                        {
                            label: totalOut,
                            fct: (param: number) => {
                                return param
                            },
                        },
                        {
                            label: realCoverage,
                            fct: (param: number) => {
                                return param
                            },
                        },
                        {
                            label: realDTESInMonths,
                            fct: (param: number) => {
                                return param
                            },
                        },
                    ],
                },
            },

            {
                label: realCoverage,
                popupTitle: realCoverageTitle,
                toDefine: realCoverageToDefine,
                toSimulate: {
                    toDisplay: [totalIn, etpMag, realCoverage],
                    toCalculate: [
                        {
                            label: totalOut,
                            fct: (param: number) => {
                                return param
                            },
                        },
                        {
                            label: lastStock,
                            fct: (param: number) => {
                                return param
                            },
                        },
                        {
                            label: realDTESInMonths,
                            fct: (param: number) => {
                                return param
                            },
                        },
                        {
                            label: realTimePerCase,
                            fct: (param: number) => {
                                return param
                            },
                        },
                    ],
                },
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
                        toCalculate: [
                            totalOut,
                            realDTESInMonths,
                            etpMag,
                            realCoverage,
                        ],
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
                        toDisplay: [
                            totalIn,
                            lastStock,
                            etpMag,
                            realTimePerCase,
                        ],
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
                        toDisplay: [
                            totalIn,
                            lastStock,
                            etpMag,
                            realTimePerCase,
                        ],
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
                        toCalculate: [
                            totalOut,
                            lastStock,
                            etpMag,
                            realDTESInMonths,
                        ],
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
                        toCalculate: [
                            totalOut,
                            lastStock,
                            etpMag,
                            realDTESInMonths,
                        ],
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
                        toCalculate: [
                            totalOut,
                            lastStock,
                            etpMag,
                            realDTESInMonths,
                        ],
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
                            realTimePerCase,
                        ],
                    },
                    {
                        locked: realTimePerCase,
                        toDisplay: [totalIn, realDTESInMonths, realTimePerCase],
                        toCalculate: [
                            totalOut,
                            lastStock,
                            etpMag,
                            realCoverage,
                        ],
                    },
                ],
            },
            {
                locked: totalOut,
                toDisplay: [
                    totalOut,
                    etpMag,
                    realDTESInMonths,
                    realTimePerCase,
                ],
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
                        toCalculate: [
                            totalOut,
                            lastStock,
                            realCoverage,
                            realTimePerCase,
                        ],
                    },
                    {
                        locked: realTimePerCase,
                        toDisplay: [totalIn, realDTESInMonths, realTimePerCase],
                        toCalculate: [
                            totalOut,
                            lastStock,
                            realCoverage,
                            etpMag,
                        ],
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
                        toDisplay: [totalIn, realDTESInMonths, realTimePerCase],
                        toCalculate: [
                            totalOut,
                            lastStock,
                            realCoverage,
                            etpMag,
                        ],
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
                locked: totalIn,
                toDisplay: [totalIn, etpMag, realTimePerCase],
                toCalculate: [
                    totalOut,
                    lastStock,
                    realCoverage,
                    realDTESInMonths,
                ],
            },
            {
                locked: totalOut,
                secondLocked: [
                    {
                        locked: totalIn,
                        toDisplay: [
                            totalIn,
                            totalOut,
                            realCoverage,
                            realTimePerCase,
                        ],
                        toCalculate: [lastStock, etpMag, realDTESInMonths],
                    },

                    {
                        locked: lastStock,
                        toDisplay: [totalOut, lastStock, realTimePerCase],
                        toCalculate: [
                            totalIn,
                            etpMag,
                            realCoverage,
                            realDTESInMonths,
                        ],
                    },
                ],
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
                        toCalculate: [
                            lastStock,
                            etpMag,
                            realCoverage,
                            realDTESInMonths,
                        ],
                    },
                    {
                        locked: etpMag,
                        toDisplay: [totalIn, etpMag, realTimePerCase],
                        toCalculate: [
                            totalOut,
                            lastStock,
                            realCoverage,
                            realDTESInMonths,
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
                        locked: '',
                        toDisplay: [totalIn, totalOut, realTimePerCase],
                        toCalculate: [
                            lastStock,
                            etpMag,
                            realCoverage,
                            realDTESInMonths,
                        ],
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
                        toCalculate: [
                            totalOut,
                            lastStock,
                            realCoverage,
                            realDTESInMonths,
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
                        locked: '',
                        toDisplay: [totalIn, realCoverage, realTimePerCase],
                        toCalculate: [
                            totalOut,
                            lastStock,
                            etpMag,
                            realDTESInMonths,
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
                        locked: '',
                        toDisplay: [totalIn, realDTESInMonths, realTimePerCase],
                        toCalculate: [
                            totalOut,
                            lastStock,
                            realCoverage,
                            etpMag,
                        ],
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
                toCalculate: [
                    lastStock,
                    etpMag,
                    realCoverage,
                    realDTESInMonths,
                ],
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
                        toCalculate: [
                            lastStock,
                            etpMag,
                            realCoverage,
                            realDTESInMonths,
                        ],
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
                        toCalculate: [
                            lastStock,
                            etpMag,
                            realCoverage,
                            realDTESInMonths,
                        ],
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
                toCalculate: [lastStock, realCoverage, realDTESInMonths, ,],
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
                        toCalculate: [
                            lastStock,
                            etpMag,
                            realCoverage,
                            realDTESInMonths,
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
                            realDTESInMonths,
                            realTimePerCase,
                            realCoverage,
                        ],
                    },
                    {
                        locked: realTimePerCase,
                        toDisplay: [totalIn, lastStock, realTimePerCase],
                        toCalculate: [
                            totalOut,
                            etpMag,
                            realCoverage,
                            realDTESInMonths,
                        ],
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
                        toCalculate: [
                            totalOut,
                            lastStock,
                            realCoverage,
                            realDTESInMonths,
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
                        toCalculate: [
                            totalOut,
                            lastStock,
                            etpMag,
                            realDTESInMonths,
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
                        locked: etpMag,
                        toDisplay: [totalIn, etpMag, realDTESInMonths],
                        toCalculate: [
                            totalOut,
                            lastStock,
                            realCoverage,
                            realTimePerCase,
                        ],
                    },

                    {
                        locked: realTimePerCase,
                        toDisplay: [totalIn, realDTESInMonths, realTimePerCase],
                        toCalculate: [
                            totalOut,
                            lastStock,
                            realCoverage,
                            etpMag,
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
                        locked: etpMag,
                        toDisplay: [totalIn, etpMag, realDTESInMonths],
                        toCalculate: [
                            totalOut,
                            lastStock,
                            realCoverage,
                            realTimePerCase,
                        ],
                    },

                    {
                        locked: realTimePerCase,
                        toDisplay: [totalIn, realDTESInMonths, realTimePerCase],
                        toCalculate: [
                            totalOut,
                            lastStock,
                            realCoverage,
                            etpMag,
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
                        locked: totalOut,
                        toDisplay: [totalIn, totalOut, realTimePerCase],
                        toCalculate: [
                            lastStock,
                            etpMag,
                            realCoverage,
                            realDTESInMonths,
                        ],
                    },

                    {
                        locked: etpMag,
                        toDisplay: [totalIn, etpMag, realTimePerCase],
                        toCalculate: [
                            totalOut,
                            lastStock,
                            realCoverage,
                            realDTESInMonths,
                        ],
                    },
                ],
            },
        ],
    },
]
export { tree }
