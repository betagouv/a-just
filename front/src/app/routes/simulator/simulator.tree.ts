const tree = [
    {
        label: 'etpMag',
        popupTitle: 'des etpMag',
        toDefine: ['un volume de', 'une variation de'],
        toAjust: [
            {
                label: 'totalIn',
                toDefine: [
                    'Une valeur sur la période',
                    'Une variation en % sur la période',
                ],
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
                toDefine: [
                    'Une valeur sur la période',
                    'Une variation en % sur la période',
                ],
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
                toDefine: ['Un temps moyen par dossier'],
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
                toDefine: [
                    'Une valeur',
                    'Une variation en % par rapport à la valeur en début de période',
                ],
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
        toDefine: ['un volume de'],
        toAjust: [],
    },
]
export { tree }
