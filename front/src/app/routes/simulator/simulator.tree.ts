const tree = [
    {
        label: 'ETPT',
        popupTitle: 'des ETPT',
        toDefine: [
            'un volume de',
            'une variation de',
        ],
        toAjust: [
            {
                label: 'Entrées',
                toDefine: [
                    'Une valeur sur la période',
                    'Une variation en % sur la période',
                ],
                toSimulate: {
                    toDisplay: ['Entrées', 'ETPT', 'Temps moyen / dossier'],
                    toCalculate: [
                        {
                            label: 'Sorties',
                            fct: (param: number) => {
                                return param
                            },
                        },
                        {
                            label: 'Stock',
                            fct: (param: number) => {
                                return param
                            },
                        },
                        {
                            label: 'Taux de couverture',
                            fct: (param: number) => {
                                return param
                            },
                        },
                        {
                            label: 'DTES',
                            fct: (param: number) => {
                                return param
                            },
                        },
                    ],
                },
            },

            {
                label: 'Sorties',
                toDefine: [
                    'Une valeur sur la période',
                    'Une variation en % sur la période',
                ],
                toSimulate: {
                    toDisplay: [
                        'Entrées',
                        'Sortie moyennes mensuelles',
                        'ETPT',
                    ],
                    toCalculate: [
                        {
                            label: 'Entrées',
                            fct: (param: number) => {
                                return param
                            },
                        },
                        {
                            label: 'Sorties moyennes mensuelles',
                            fct: (param: number) => {
                                return param
                            },
                        },
                        {
                            label: 'ETPT',
                            fct: (param: number) => {
                                return param
                            },
                        },
                    ],
                },
            },

            {
                label: 'Temps moyen / dossier',
                toDefine: ['Un temps moyen par dossier'],
                toSimulate: {
                    toDisplay: ['Entrées', 'ETPT', 'Temps moyen / dossier'],
                    toCalculate: [
                        {
                            label: 'Sorties',
                            fct: (param: number) => {
                                return param
                            },
                        },
                        {
                            label: 'Stock',
                            fct: (param: number) => {
                                return param
                            },
                        },
                        {
                            label: 'Taux de couverture',
                            fct: (param: number) => {
                                return param
                            },
                        },
                        {
                            label: 'DTES',
                            fct: (param: number) => {
                                return param
                            },
                        },
                    ],
                },
            },

            {
                label: 'DTES',
                toDefine: [
                    'Une valeur',
                    'Une variation en % par rapport à la valeur en début de période',
                ],
                toSimulate: {
                    toDisplay: ['Entrées', 'ETPT', 'DTES'],
                    toCalculate: [
                        {
                            label: 'Sorties',
                            fct: (param: number) => {
                                return param
                            },
                        },
                        {
                            label: 'Stock',
                            fct: (param: number) => {
                                return param
                            },
                        },
                        {
                            label: 'Taux de couverture',
                            fct: (param: number) => {
                                return param
                            },
                        },
                        {
                            label: 'Temps moyen / dossier',
                            fct: (param: number) => {
                                return param
                            },
                        },
                    ],
                },
            },

            {
                label: 'Stock',
                toDefine: [
                    'Une valeur',
                    'Une variation en % par rapport à la valeur en début de période',
                ],
                toSimulate: {
                    toDisplay: [
                        'Entrées',
                        'Stock',
                        'ETPT',
                        'Temps moyen / dossier',
                    ],
                    toCalculate: [
                        {
                            label: 'Sorties',
                            fct: (param: number) => {
                                return param
                            },
                        },
                        {
                            label: 'Taux de couverture',
                            fct: (param: number) => {
                                return param
                            },
                        },
                        {
                            label: 'DTES',
                            fct: (param: number) => {
                                return param
                            },
                        },
                    ],
                },
            },

            {
                label: 'Taux de couverture',
                toDefine: ['Une valeur en %'],
                toSimulate: {
                    toDisplay: ['Entrées', 'ETPT', 'Taux de couverture'],
                    toCalculate: [
                        {
                            label: 'Sorties',
                            fct: (param: number) => {
                                return param
                            },
                        },
                        {
                            label: 'Stock',
                            fct: (param: number) => {
                                return param
                            },
                        },
                        {
                            label: 'DTES',
                            fct: (param: number) => {
                                return param
                            },
                        },
                        {
                            label: 'Temps moyen / dossier',
                            fct: (param: number) => {
                                return param
                            },
                        },
                    ],
                },
            },
        ],
    },
]
export { tree }
