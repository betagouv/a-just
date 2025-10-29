export const loginApi = (email: string, password: string) => {
  cy.log(`Logging in with email: ${email} and password: ${password}`);
  const serverUrl =
    Cypress.env("NG_APP_SERVER_URL") || "http://localhost:8081/api";
  return cy.request({
    method: "POST",
    url: `${serverUrl}/auths/login`,
    body: {
      email: email,
      password: password,
    },
    // keep cookies-based session
    withCredentials: true,
  });
};

// ----------------- Helpers for extractor comparison (no backend changes) -----------------

export const authLoginApi = (serverUrl: string, email: string, password: string) => {
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

export const extractorStartApi = (serverUrl: string, params: {
  backupId: number;
  dateStart: string; // YYYY-MM-DD
  dateStop: string;  // YYYY-MM-DD
  categoryFilter: string[];
}) => {
  return cy.request({
    method: "POST",
    url: `${serverUrl}/extractor/start-filter-list`,
    withCredentials: true,
    body: params,
    timeout: 180000,
  });
};

export const extractorActivitiesApi = (serverUrl: string, params: {
  backupId: number;
  dateStart: string; // YYYY-MM-DD
  dateStop: string;  // YYYY-MM-DD
}) => {
  return cy.request({
    method: "POST",
    url: `${serverUrl}/extractor/filter-list-act`,
    withCredentials: true,
    body: params,
    timeout: 180000,
  });
};

export const getLastMonthApi = () => {
  const backupId = window.localStorage.getItem("backupId");
  const token = window.localStorage.getItem("token");
  const serverUrl =
    Cypress.env("NG_APP_SERVER_URL") || "http://localhost:8081/api";

  return cy.request({
    method: "POST",
    url: `${serverUrl}/activities/get-last-month`,
    headers: {
      Authorization: `${token}`,
    },
    body: { hrBackupId: backupId },
  });
};

export const updateHumanResourcesApi = (hrData: any) => {
  const backupId = window.localStorage.getItem("backupId");
  const token = window.localStorage.getItem("token");
  const serverUrl =
    Cypress.env("NG_APP_SERVER_URL") || "http://localhost:8081/api";

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
};

export const getUserDataApi = (token: string) => {
  const serverUrl =
    Cypress.env("NG_APP_SERVER_URL") || "http://localhost:8081/api";

  return cy.request({
    method: "GET",
    url: `${serverUrl}/users/get-user-datas`,
    headers: {
      Authorization: `${token}`,
    },
  });
};

export const updateUserAccounatApi = ({
  userId,
  accessIds,
  ventilations,
  token,
}: {
  userId: number;
  accessIds: any;
  ventilations: any;
  token: string;
}) => {
  const serverUrl =
    Cypress.env("NG_APP_SERVER_URL") || "http://localhost:8081/api";

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
    },
  });
};
