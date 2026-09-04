import user from "../fixtures/user.json";

export const DEFAULT_BACKUP_LABEL = "TJ TEST";

export const loginApi = (email: string, password: string) => {
  cy.log(`Logging in with email: ${email} and password: ${password}`);
  let serverUrl: string | null = null;
  // const serverUrl =
  //   cy.env(["NG_APP_SERVER_URL"]) || "http://localhost:8081/api";
  // cy.log("NG_APP_SERVER_URL:", cy.env(["NG_APP_SERVER_URL"]));
  // cy.log("Using server URL:", serverUrl);

  return cy.env(["NG_APP_SERVER_URL"]).then(({ NG_APP_SERVER_URL }) => {
    serverUrl = NG_APP_SERVER_URL || "http://localhost:8081/api";
    return cy.request({
      method: "POST",
      url: `${serverUrl}/auths/login`,
      body: {
        email: email,
        password: password,
      },
    });
  });
};

// ----------------- Helpers for extractor comparison (no backend changes) -----------------

export const authLoginApi = (
  serverUrl: string,
  email: string,
  password: string,
) => {
  return cy.request({
    method: "POST",
    url: `${serverUrl}/auths/login`,
    withCredentials: true,
    body: { email, password },
    failOnStatusCode: false,
  });
};

export const hrGetCurrentApi = (serverUrl: string, backupId?: number) => {
  return cy.request({
    method: "POST",
    url: `${serverUrl}/human-resources/get-current-hr`,
    withCredentials: true,
    body: { backupId: backupId ?? null },
  });
};

export const extractorStartApi = (
  serverUrl: string,
  params: {
    backupId: number;
    dateStart: string; // YYYY-MM-DD
    dateStop: string; // YYYY-MM-DD
    categoryFilter: string[];
  },
) => {
  return cy.request({
    method: "POST",
    url: `${serverUrl}/extractor/start-filter-list`,
    withCredentials: true,
    body: params,
    timeout: 180000,
  });
};

export const extractorActivitiesApi = (params: {
  backupId: number;
  dateStart: string; // YYYY-MM-DD
  dateStop: string; // YYYY-MM-DD
}) => {
  let serverUrl: string | null = null;

  return cy.env(["NG_APP_SERVER_URL"]).then(({ NG_APP_SERVER_URL }) => {
    serverUrl = NG_APP_SERVER_URL || "http://localhost:8081/api";
    return cy.request({
      method: "POST",
      url: `${serverUrl}/extractor/filter-list-act`,
      withCredentials: true,
      body: params,
      timeout: 180000,
    });
  });
};

export const getLastMonthApi = () => {
  const backupId = window.localStorage.getItem("backupId");
  const token = window.localStorage.getItem("token");
  let serverUrl: string | null = null;

  return cy.env(["NG_APP_SERVER_URL"]).then(({ NG_APP_SERVER_URL }) => {
    serverUrl = NG_APP_SERVER_URL || "http://localhost:8081/api";
    return cy.request({
      method: "POST",
      url: `${serverUrl}/activities/get-last-month`,
      headers: {
        Authorization: `${token}`,
      },
      body: { hrBackupId: backupId },
    });
  });
};

export const updateHumanResourcesApi = (hrData: any) => {
  const backupId = window.localStorage.getItem("backupId");
  const token = window.localStorage.getItem("token");
  let serverUrl: string | null = null;

  return cy.env(["NG_APP_SERVER_URL"]).then(({ NG_APP_SERVER_URL }) => {
    serverUrl = NG_APP_SERVER_URL || "http://localhost:8081/api";
    return cy.request({
      method: "POST",
      url: `${serverUrl}/human-resources/update-hr`,
      headers: {
        Authorization: `${token}`,
      },
      body: {
        backupId: backupId,
        hr: hrData,
      },
    });
  });
};

/**
 * Liste de tous les backups en base (route réservée aux administrateurs).
 * Utilisable même quand l'utilisateur n'a plus aucun droit métier.
 */
export const getAllBackupsApi = (token: string) => {
  return cy.env(["NG_APP_SERVER_URL"]).then(({ NG_APP_SERVER_URL }) => {
    const serverUrl = NG_APP_SERVER_URL || "http://localhost:8081/api";
    return cy.request({
      method: "GET",
      url: `${serverUrl}/juridictions/get-all-backup`,
      headers: {
        Authorization: `${token}`,
      },
    });
  });
};

export const getUserDataApi = (token: string) => {
  let serverUrl: string | null = null;

  return cy.env(["NG_APP_SERVER_URL"]).then(({ NG_APP_SERVER_URL }) => {
    serverUrl = NG_APP_SERVER_URL || "http://localhost:8081/api";
    return cy.request({
      method: "GET",
      url: `${serverUrl}/users/get-user-datas`,
      headers: {
        Authorization: `${token}`,
      },
    });
  });
};

export const updateUserAccounatApi = ({
  userId,
  accessIds,
  ventilations,
  referentielIds,
  token,
}: {
  userId: number;
  accessIds: any;
  ventilations: any;
  referentielIds?: any;
  token: string;
}) => {
  let serverUrl: string = "http://localhost:8081/api";

  return cy.env(["NG_APP_SERVER_URL"]).then(({ NG_APP_SERVER_URL }) => {
    serverUrl = NG_APP_SERVER_URL;
    return cy.request({
      method: "POST",
      url: `${serverUrl}/users/update-account`,
      headers: {
        Authorization: `${token}`,
      },
      body: {
        userId: userId,
        access: accessIds,
        ventilations: ventilations,
        referentielIds: referentielIds,
      },
    });
  });
};

/**
 * Reset user permissions to default state matching E2E seeder
 * Use in before/after hooks to ensure test isolation ("ceinture et bretelles")
 */
export const resetToDefaultPermissions = (
  userId: number,
  ventilations: number[],
  token: string,
) => {
  // Full permissions matching api/src/db/seeders/test/202511261700-add-e2e-test-user.js
  const allPermissions = [
    1.1,
    1.2, // Dashboard (Panorama) - reader + writer
    2.1,
    2.2, // Ventilations - reader + writer
    3.1,
    3.2, // Activities - reader + writer
    4.1,
    4.2, // Average time - reader + writer
    5.1,
    5.2, // Calculator (Cockpit) - reader + writer
    6.1,
    6.2, // Simulator - reader + writer
    61.1,
    61.2, // White simulator - reader + writer
    7.1,
    7.2, // Reaffectator - reader + writer
    8, // HAS_ACCESS_TO_MAGISTRAT
    9, // HAS_ACCESS_TO_GREFFIER
    10, // HAS_ACCESS_TO_CONTRACTUEL
  ];

  return updateUserAccounatApi({
    userId,
    accessIds: allPermissions,
    ventilations,
    referentielIds: null, // Set to null for dashboard access (completeReferentielGuard)
    token,
  });
};

/**
 * Prépare l'utilisateur E2E avant tout login UI: connexion API, rattachement à un
 * backup puis réapplication des droits par défaut.
 *
 * Les droits sont restaurés sans passer par `get-user-datas`, qui exige désormais
 * des droits et une ventilation non vides et échouerait donc quand un test
 * précédent a laissé l'utilisateur sans accès.
 */
export const ensureE2EUserReady = (
  options: { backupLabel?: string } = {},
): Cypress.Chainable<{
  userId: number;
  token: string;
  ventilations: number[];
}> => {
  const { backupLabel } = options;

  return loginApi(user.email, user.password).then((resp) => {
    const userId = resp.body.user.id;
    const token = resp.body.token;
    const currentVentilations: number[] = resp.body.user.ventilations || [];

    if (!backupLabel && currentVentilations.length) {
      return resetToDefaultPermissions(userId, currentVentilations, token).then(
        () => ({ userId, token, ventilations: currentVentilations }),
      );
    }

    return getAllBackupsApi(token).then((backupsResp) => {
      const allBackups = Array.isArray(backupsResp.body)
        ? backupsResp.body
        : backupsResp.body.data || backupsResp.body.list || [];
      const label = backupLabel || DEFAULT_BACKUP_LABEL;
      const backup =
        allBackups.find((b: any) => b.label === label) || allBackups[0];

      if (!backup) {
        throw new Error(
          `Aucun backup disponible en base (recherché: ${label})`,
        );
      }

      const ventilations = [backup.id];
      return resetToDefaultPermissions(userId, ventilations, token).then(
        () => ({ userId, token, ventilations }),
      );
    });
  });
};
