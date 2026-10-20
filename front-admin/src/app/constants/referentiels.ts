export const VALUE_QUALITY_OPTION = 'facultatif';
export const VALUE_QUALITY_GOOD = 'good';
export const VALUE_QUALITY_TO_COMPLETE = 'to_complete';
export const VALUE_QUALITY_TO_VERIFY = 'to_verify';

export type ReferentielVisibility = 'everywhere' | 'extractor' | 'cockpit' | 'activity';

export const REFERENTIEL_VISIBILITY_OPTIONS: { value: ReferentielVisibility; label: string }[] = [
  { value: 'everywhere', label: 'Partout' },
  { value: 'extractor', label: "Dans l'extracteur" },
  { value: 'cockpit', label: 'Dans le cockpit' },
  { value: 'activity', label: "Dans les données d'activité" },
];

export const QUALITY_LIST = [
  {
    label: 'Facultative',
    key: VALUE_QUALITY_OPTION,
  },
  {
    label: 'Bonne',
    key: VALUE_QUALITY_GOOD,
  },
  {
    label: 'À compléter',
    key: VALUE_QUALITY_TO_COMPLETE,
  },
  {
    label: 'À vérifier',
    key: VALUE_QUALITY_TO_VERIFY
  }
];
