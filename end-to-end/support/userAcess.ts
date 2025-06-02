export const USER_ACCESS_DASHBOARD = 1;
export const USER_ACCESS_VENTILATIONS = 2;
export const USER_ACCESS_ACTIVITIES = 3;
export const USER_ACCESS_AVERAGE_TIME = 4;
export const USER_ACCESS_CALCULATOR = 5;
export const USER_ACCESS_SIMULATOR = 6;
export const USER_ACCESS_WHITE_SIMULATOR = 61;
export const USER_ACCESS_REAFFECTATOR = 7;
export const HAS_ACCESS_TO_MAGISTRAT = 8;
export const HAS_ACCESS_TO_GREFFIER = 9;
export const HAS_ACCESS_TO_CONTRACTUEL = 10;

export const accessUrlToString = (roleId) => {
  switch (roleId) {
    case USER_ACCESS_DASHBOARD:
      return "panorama";
    case USER_ACCESS_VENTILATIONS:
      return "ventilations";
    case USER_ACCESS_ACTIVITIES:
      return "donnees-d-activite";
    // case USER_ACCESS_AVERAGE_TIME:
    //   return "Temps moyens";
    case USER_ACCESS_CALCULATOR:
      return "cockpit";
    case USER_ACCESS_SIMULATOR:
      return "simulateur";
    case USER_ACCESS_WHITE_SIMULATOR:
      return "simulateur-sans-donnees";
    case USER_ACCESS_REAFFECTATOR:
      return "reaffectateur";
  }
};

export const accessUrlList = [
  {
    id: USER_ACCESS_DASHBOARD,
    label: accessUrlToString(USER_ACCESS_DASHBOARD),
  },
  {
    id: USER_ACCESS_VENTILATIONS,
    label: accessUrlToString(USER_ACCESS_VENTILATIONS),
  },
  {
    id: USER_ACCESS_ACTIVITIES,
    label: accessUrlToString(USER_ACCESS_ACTIVITIES),
  },
  // {
  //   id: USER_ACCESS_AVERAGE_TIME,
  //   label: accessUrlToString(USER_ACCESS_AVERAGE_TIME),
  // },
  {
    id: USER_ACCESS_CALCULATOR,
    label: accessUrlToString(USER_ACCESS_CALCULATOR),
  },
  {
    id: USER_ACCESS_SIMULATOR,
    label: accessUrlToString(USER_ACCESS_SIMULATOR),
  },
  {
    id: USER_ACCESS_WHITE_SIMULATOR,
    label: accessUrlToString(USER_ACCESS_WHITE_SIMULATOR),
  },
  {
    id: USER_ACCESS_REAFFECTATOR,
    label: accessUrlToString(USER_ACCESS_REAFFECTATOR),
  },
];

export const accessFonctionsToString = (roleId) => {
  switch (roleId) {
    case HAS_ACCESS_TO_MAGISTRAT:
      return "Accès aux magistrats";
    case HAS_ACCESS_TO_GREFFIER:
      return "Accès aux greffiers";
    case HAS_ACCESS_TO_CONTRACTUEL:
      return "Accès aux contractuels";
  }
};

export const accessFonctionsList = [
  {
    id: HAS_ACCESS_TO_MAGISTRAT,
    label: accessFonctionsToString(HAS_ACCESS_TO_MAGISTRAT),
  },
  {
    id: HAS_ACCESS_TO_GREFFIER,
    label: accessFonctionsToString(HAS_ACCESS_TO_GREFFIER),
  },
  {
    id: HAS_ACCESS_TO_CONTRACTUEL,
    label: accessFonctionsToString(HAS_ACCESS_TO_CONTRACTUEL),
  },
];
