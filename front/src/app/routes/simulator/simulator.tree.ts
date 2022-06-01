const ETPMAG = 'etpMag'

const tree = [
    {
        label: 'etpMag',
        popupTitle: 'des etpMag',
        toDefine: ['un volume de', 'une variation de'],
        toAjust: [
            {
                label: 'totalIn',
                toDefine: ['une valeur sur la période de', 'une variation de'],
                toSimulate: {
                    toDisplay: ['totalIn', 'etpMag', 'realTimePerCase'],
                    toCalculate: [
                        {
                            label: 'totalOut',
                            fct: (param: number) => {
                                return param
                            },
                        },
                        {
                            label: 'lastStock',
                            fct: (param: number) => {
                                return param
                            },
                        },
                        {
                            label: 'realCoverage',
                            fct: (param: number) => {
                                return param
                            },
                        },
                        {
                            label: 'realDTESInMonths',
                            fct: (param: number) => {
                                return param
                            },
                        },
                    ],
                },
            },

            {
                label: 'totalOut',
                toDefine: ['une valeur sur la période de', 'une variation de'],
                toSimulate: {
                    toDisplay: ['totalIn', 'totalOut', 'etpMag'],
                    toCalculate: [
                        {
                            label: 'totalIn',
                            fct: (param: number) => {
                                return param
                            },
                        },
                        {
                            label: 'totalOut',
                            fct: (param: number) => {
                                return param
                            },
                        },
                        {
                            label: 'etpMag',
                            fct: (param: number) => {
                                return param
                            },
                        },
                    ],
                },
            },

            {
                label: 'realTimePerCase',
                toDefine: ['un temps moyen par dossier de'],
                toSimulate: {
                    toDisplay: ['totalIn', 'etpMag', 'realTimePerCase'],
                    toCalculate: [
                        {
                            label: 'totalOut',
                            fct: (param: number) => {
                                return param
                            },
                        },
                        {
                            label: 'lastStock',
                            fct: (param: number) => {
                                return param
                            },
                        },
                        {
                            label: 'realCoverage',
                            fct: (param: number) => {
                                return param
                            },
                        },
                        {
                            label: 'realDTESInMonths',
                            fct: (param: number) => {
                                return param
                            },
                        },
                    ],
                },
            },

            {
                label: 'realDTESInMonths',
                toDefine: ['une valeur de', 'une variation de'],
                toSimulate: {
                    toDisplay: ['totalIn', 'etpMag', 'realDTESInMonths'],
                    toCalculate: [
                        {
                            label: 'totalOut',
                            fct: (param: number) => {
                                return param
                            },
                        },
                        {
                            label: 'lastStock',
                            fct: (param: number) => {
                                return param
                            },
                        },
                        {
                            label: 'realCoverage',
                            fct: (param: number) => {
                                return param
                            },
                        },
                        {
                            label: 'realTimePerCase',
                            fct: (param: number) => {
                                return param
                            },
                        },
                    ],
                },
            },

            {
                label: 'lastStock',
                toDefine: ['une valeur de', 'une variation de'],
                toSimulate: {
                    toDisplay: [
                        'totalIn',
                        'lastStock',
                        'etpMag',
                        'realTimePerCase',
                    ],
                    toCalculate: [
                        {
                            label: 'totalOut',
                            fct: (param: number) => {
                                return param
                            },
                        },
                        {
                            label: 'realCoverage',
                            fct: (param: number) => {
                                return param
                            },
                        },
                        {
                            label: 'realDTESInMonths',
                            fct: (param: number) => {
                                return param
                            },
                        },
                    ],
                },
            },

            {
                label: 'realCoverage',
                toDefine: ['Une valeur en %'],
                toSimulate: {
                    toDisplay: ['totalIn', 'etpMag', 'realCoverage'],
                    toCalculate: [
                        {
                            label: 'totalOut',
                            fct: (param: number) => {
                                return param
                            },
                        },
                        {
                            label: 'lastStock',
                            fct: (param: number) => {
                                return param
                            },
                        },
                        {
                            label: 'realDTESInMonths',
                            fct: (param: number) => {
                                return param
                            },
                        },
                        {
                            label: 'realTimePerCase',
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
        label: 'lastStock',
        popupTitle: 'des Stocks',
        toDefine: ['une valeur de', 'une variation de'],
        toAjust: [
            {
                label: 'totalIn',
                popupTitle: 'des entrées mensuelles moyennes',
                toDefine: ['une valeur de', 'une variation de'],
                toSimulate: [
                    {
                        locked: 'ETPT',
                        toDisplay: ['totalIn', 'lastStock', 'etpMag'],
                        toCalculate: [
                            'totalOut',
                            'realDTESInMonths',
                            'realTimePerCase',
                            'realCoverage',
                        ],
                    },
                    {
                        locked: 'realTimePerCase',
                        toDisplay: ['totalIn', 'lastStock', 'realTimePerCase'],
                        toCalculate: [
                            'totalOut',
                            'realDTESInMonths',
                            'etpMag',
                            'realCoverage',
                        ],
                    },
                ],
            },

            {
                label: 'etpMag',
                popupTitle: 'des etpMag',
                toDefine: ['un nombre de', 'une variation de'],
                toSimulate: [
                    {
                        locked: '',
                        toDisplay: [
                            'totalIn',
                            'lastStock',
                            'etpMag',
                            'realTimePerCase',
                        ],
                        toCalculate: [
                            'totalOut',
                            'realDTESInMonths',
                            'realCoverage',
                        ],
                    },
                ],
            },

            {
                label: 'realTimePerCase',
                popupTitle: 'des Temps moyen / Dossier',
                toDefine: ['un temps moyen par dossier de'],
                toSimulate: [
                    {
                        locked: '',
                        toDisplay: [
                            'totalIn',
                            'lastStock',
                            'etpMag',
                            'realTimePerCase',
                        ],
                        toCalculate: [
                            'totalOut',
                            'realDTESInMonths',
                            'realCoverage',
                        ],
                    },
                ],
            },
        ],
    },

    {
        label: 'realCoverage',
        popupTitle: 'du taux de couverture',
        toDefine: ['une valeur de (en%)'],
        toAjust: [
            {
                label: 'totalIn',
                popupTitle: 'des entrées mensuelles',
                toDefine: ['une valeur de', 'une variation de'],
                toSimulate: [
                    {
                        locked: 'ETPT',
                        toDisplay: ['totalIn', 'etpMag', 'realCoverage'],
                        toCalculate: [
                            'totalOut',
                            'lastStock',
                            'realDTESInMonths',
                            'realTimePerCase',
                        ],
                    },
                    {
                        locked: 'realTimePerCase',
                        toDisplay: [
                            'totalIn',
                            'realCoverage',
                            'realTimePerCase',
                        ],
                        toCalculate: [
                            'totalOut',
                            'lastStock',
                            'etpMag',
                            'realDTESInMonths',
                        ],
                    },
                ],
            },

            {
                label: 'etpMag',
                popupTitle: 'des etpMag',
                toDefine: ['un nombre de', 'une variation de'],
                toSimulate: [
                    {
                        locked: '',
                        toDisplay: ['totalIn', 'etpMag', 'realCoverage'],
                        toCalculate: [
                            'totalOut',
                            'lastStock',
                            'realDTESInMonths',
                            'realTimePerCase',
                        ],
                    },
                ],
            },

            {
                label: 'realTimePerCase',
                popupTitle: 'un Temps moyen / Dossier',
                toDefine: ['un temps moyen par dossier en heure'],
                toSimulate: [
                    {
                        locked: '',
                        toDisplay: [
                            'totalIn',
                            'realCoverage',
                            'realTimePerCase',
                        ],
                        toCalculate: [
                            'totalOut',
                            'lastStock',
                            'etpMag',
                            'realDTESInMonths',
                        ],
                    },
                ],
            },
        ],
    },

    {
        label: 'realDTESInMonths',
        popupTitle: 'du DTES',
        toDefine: ['une valeur de', 'une variation de'],
        toAjust: [
            {
                label: 'totalIn',
                popupTitle: 'des entrées mensuelles',
                toDefine: ['une valeur de', 'une variation de'],
                toSimulate: [
                    {
                        locked: 'ETPT',
                        toDisplay: ['totalIn', 'etpMag', 'realDTESInMonths'],
                        toCalculate: [
                            'totalOut',
                            'lastStock',
                            'realCoverage',
                            'realTimePerCase',
                        ],
                    },
                    {
                        locked: 'realTimePerCase',
                        toDisplay: [
                            'totalIn',
                            'realDTESInMonths',
                            'realTimePerCase',
                        ],
                        toCalculate: [
                            'totalOut',
                            'lastStock',
                            'realCoverage',
                            'etpMag',
                        ],
                    },
                ],
            },

            {
                label: 'etpMag',
                popupTitle: 'des etpMag',
                toDefine: ['un nombre de', 'une variation de'],
                toSimulate: [
                    {
                        locked: '',
                        toDisplay: ['totalIn', 'etpMag', 'realDTESInMonths'],
                        toCalculate: [
                            'totalOut',
                            'lastStock',
                            'realCoverage',
                            'realTimePerCase',
                        ],
                    },
                ],
            },

            {
                label: 'realTimePerCase',
                popupTitle: 'du Temps moyen / Dossier',
                toDefine: ['un temps moyen par dossier en heure'],
                toSimulate: [
                    {
                        locked: '',
                        toDisplay: [
                            'totalIn',
                            'realDTESInMonths',
                            'realTimePerCase',
                        ],
                        toCalculate: [
                            'totalOut',
                            'lastStock',
                            'realCoverage',
                            'etpMag',
                        ],
                    },
                ],
            },
        ],
    },

    {
        label: 'realTimePerCase',
        popupTitle: 'du Temps moyen / Dossier',
        toDefine: ['un temps moyen par dossier en heure'],
        toAjust: [
            {
                label: 'totalIn',
                popupTitle: 'des entrées mensuelles',
                toDefine: ['une valeur de', 'une variation de'],
                toSimulate: [
                    {
                        locked: 'totalOut',
                        toDisplay: ['totalIn', 'totalOut', 'realTimePerCase'],
                        toCalculate: [
                            'lastStock',
                            'etpMag',
                            'realCoverage',
                            'realDTESInMonths',
                        ],
                    },
                    {
                        locked: 'etpMag',
                        toDisplay: ['totalIn', 'etpMag', 'realTimePerCase'],
                        toCalculate: [
                            'totalOut',
                            'lastStock',
                            'realCoverage',
                            'realDTESInMonths',
                        ],
                    },
                ],
            },

            {
                label: 'totalOut',
                popupTitle: 'des Sorties mensuelles moyennes',
                toDefine: ['une valeur de', 'une variation de'],
                toSimulate: [
                    {
                        locked: '',
                        toDisplay: ['totalIn', 'totalOut', 'realTimePerCase'],
                        toCalculate: [
                            'lastStock',
                            'etpMag',
                            'realCoverage',
                            'realDTESInMonths',
                        ],
                    },
                ],
            },

            {
                label: 'etpMag',
                popupTitle: 'des etpMag',
                toDefine: ['un nombre de', 'une variation de'],
                toSimulate: [
                    {
                        locked: '',
                        toDisplay: ['totalIn', 'etpMag', 'realTimePerCase'],
                        toCalculate: [
                            'totalOut',
                            'lastStock',
                            'realCoverage',
                            'realDTESInMonths',
                        ],
                    },
                ],
            },
            {
                label: 'realCoverage',
                popupTitle: 'du taux de couverture',
                toDefine: ['une valeur de (en%)'],
                toSimulate: [
                    {
                        locked: '',
                        toDisplay: [
                            'totalIn',
                            'realCoverage',
                            'realTimePerCase',
                        ],
                        toCalculate: [
                            'totalOut',
                            'lastStock',
                            'etpMag',
                            'realDTESInMonths',
                        ],
                    },
                ],
            },

            {
                label: 'realDTESInMonths',
                popupTitle: 'du DTES à la fin de la période',
                toDefine: ['une valeur de', 'une variation de'],
                toSimulate: [
                    {
                        locked: '',
                        toDisplay: [
                            'totalIn',
                            'realDTESInMonths',
                            'realTimePerCase',
                        ],
                        toCalculate: [
                            'totalOut',
                            'lastStock',
                            'realCoverage',
                            'etpMag',
                        ],
                    },
                ],
            },
        ],
    },

    {
        label: 'totalOut',
        popupTitle: 'du nombre de Sorties mensuelles moyennes',
        toDefine: ['une valeur de', 'une variation de'],
        toAjust: [
            {
                label: 'totalIn',
                popupTitle: 'des entrées mensuelles',
                toDefine: ['une valeur de', 'une variation de'],
                toSimulate: [
                    {
                        locked: 'etpMag',
                        toDisplay: ['totalIn', 'totalOut', 'etpMag'],
                        toCalculate: [
                            'lastStock',
                            'realCoverage',
                            'realDTESInMonths',
                            'realTimePerCase',
                        ],
                    },
                    {
                        locked: 'realTimePerCase',
                        toDisplay: ['totalIn', 'totalOut', 'realTimePerCase'],
                        toCalculate: [
                            'lastStock',
                            'etpMag',
                            'realCoverage',
                            'realDTESInMonths',
                        ],
                    },
                ],
            },

            {
                label: 'etpMag',
                popupTitle: 'des etpMag',
                toDefine: ['un nombre de', 'une variation de'],
                toSimulate: [
                    {
                        locked: '',
                        toDisplay: ['totalIn', 'totalOut', 'etpMag'],
                        toCalculate: [
                            'lastStock',
                            'realCoverage',
                            'realDTESInMonths',
                            'realTimePerCase',
                        ],
                    },
                ],
            },

            {
                label: 'realTimePerCase',
                popupTitle: 'du Temps moyen / Dossier',
                toDefine: ['un temps moyen par dossier en heure'],
                toSimulate: [
                    {
                        locked: '',
                        toDisplay: ['totalIn', 'totalOut', 'realTimePerCase'],
                        toCalculate: [
                            'lastStock',
                            'etpMag',
                            'realCoverage',
                            'realDTESInMonths',
                        ],
                    },
                ],
            },
        ],
    },

    {
        label: 'totalIn',
        popupTitle: 'des entrées mensuelles moyennes',
        toDefine: ['une valeur de', 'une variation de'],
        toAjust: [
            {
                label: 'totalOut',
                popupTitle: 'des entrées mensuelles',
                toDefine: ['une valeur de', 'une variation de'],
                toSimulate: [
                    {
                        locked: 'etpMag',
                        toDisplay: ['totalIn', 'totalOut', 'etpMag'],
                        toCalculate: [
                            'lastStock',
                            'realCoverage',
                            'realDTESInMonths',
                            'realTimePerCase',
                        ],
                    },
                    {
                        locked: 'realTimePerCase',
                        toDisplay: ['totalIn', 'totalOut', 'realTimePerCase'],
                        toCalculate: [
                            'lastStock',
                            'etpMag',
                            'realCoverage',
                            'realDTESInMonths',
                        ],
                    },
                ],
            },

            {
                label: 'lastStock',
                popupTitle: 'des Stocks',
                toDefine: ['une valeur de', 'une variation de'],
                toSimulate: [
                    {
                        locked: 'etpMag',
                        toDisplay: ['totalIn', 'lastStock', 'etpMag'],
                        toCalculate: [
                            'totalOut',
                            'realDTESInMonths',
                            'realTimePerCase',
                            'realCoverage',
                        ],
                    },
                    {
                        locked: 'realTimePerCase',
                        toDisplay: ['totalIn', 'lastStock', 'realTimePerCase'],
                        toCalculate: [
                            'totalOut',
                            'etpMag',
                            'realCoverage',
                            'realDTESInMonths',
                        ],
                    },
                ],
            },

            {
                label: 'etpMag',
                popupTitle: 'des etpMag',
                toDefine: ['un nombre de', 'une variation de'],
                toSimulate: [
                    {
                        locked: '',
                        toDisplay: ['totalIn', 'etpMag', 'realTimePerCase'],
                        toCalculate: [
                            'totalOut',
                            'lastStock',
                            'realCoverage',
                            'realDTESInMonths',
                        ],
                    },
                ],
            },

            {
                label: 'realCoverage',
                popupTitle: 'du Taux de couverture',
                toDefine: ['une valeur (en%)'],
                toSimulate: [
                    {
                        locked: 'etpMag',
                        toDisplay: ['totalIn', 'etpMag', 'realCoverage'],
                        toCalculate: [
                            'totalOut',
                            'lastStock',
                            'realDTESInMonths',
                            'realTimePerCase',
                        ],
                    },

                    {
                        locked: 'realTimePerCase',
                        toDisplay: [
                            'totalIn',
                            'realCoverage',
                            'realTimePerCase',
                        ],
                        toCalculate: [
                            'totalOut',
                            'lastStock',
                            'etpMag',
                            'realDTESInMonths',
                        ],
                    },
                ],
            },

            {
                label: 'realDTESInMonths',
                popupTitle: 'du DTES',
                toDefine: ['une valeur de', 'une variation de'],
                toSimulate: [
                    {
                        locked: 'etpMag',
                        toDisplay: ['totalIn', 'etpMag', 'realDTESInMonths'],
                        toCalculate: [
                            'totalOut',
                            'lastStock',
                            'realCoverage',
                            'realTimePerCase',
                        ],
                    },

                    {
                        locked: 'realTimePerCase',
                        toDisplay: [
                            'totalIn',
                            'realDTESInMonths',
                            'realTimePerCase',
                        ],
                        toCalculate: [
                            'totalOut',
                            'lastStock',
                            'realCoverage',
                            'etpMag',
                        ],
                    },
                ],
            },

            {
                label: 'realDTESInMonths',
                popupTitle: 'du DTES',
                toDefine: ['une valeur de', 'une variation de'],
                toSimulate: [
                    {
                        locked: 'etpMag',
                        toDisplay: ['totalIn', 'etpMag', 'realDTESInMonths'],
                        toCalculate: [
                            'totalOut',
                            'lastStock',
                            'realCoverage',
                            'realTimePerCase',
                        ],
                    },

                    {
                        locked: 'realTimePerCase',
                        toDisplay: [
                            'totalIn',
                            'realDTESInMonths',
                            'realTimePerCase',
                        ],
                        toCalculate: [
                            'totalOut',
                            'lastStock',
                            'realCoverage',
                            'etpMag',
                        ],
                    },
                ],
            },

            {
                label: 'realTimePerCase',
                popupTitle: 'du Temps moyen / Dossier',
                toDefine: ['un temps moyen par dossier en heure'],
                toSimulate: [
                    {
                        locked: 'totalOut',
                        toDisplay: ['totalIn', 'totalOut', 'realTimePerCase'],
                        toCalculate: [
                            'lastStock',
                            'etpMag',
                            'realCoverage',
                            'realDTESInMonths',
                        ],
                    },

                    {
                        locked: 'etpMag',
                        toDisplay: ['totalIn', 'etpMag', 'realTimePerCase'],
                        toCalculate: [
                            'totalOut',
                            'lastStock',
                            'realCoverage',
                            'realDTESInMonths',
                        ],
                    },
                ],
            },
        ],
    },
]
export { tree }
