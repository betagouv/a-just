import user from "../../fixtures/user.json";
import { accessUrlList, accessFonctionsList } from "../../support/userAcess";
import { menuContentTools } from "../../support/menuContent";
import {
  updateUserAccounatApi,
  resetToDefaultPermissions,
  ensureE2EUserReady,
} from "../../support/api";

describe("Test d'accés aux pages", () => {
  let userId;
  let token;
  let ventilations = [];

  before(() => {
    return ensureE2EUserReady().then((ready) => {
      userId = ready.userId;
      token = ready.token;
      ventilations = ready.ventilations;
    });
  });

  afterEach(() => {
    // "Bretelles": Always restore to full default permissions after each test
    // This ensures test isolation even if a test fails or modifies permissions
    // Rate limiting has been disabled in test config (maxQueryLimit: 10000000)
    resetToDefaultPermissions(userId, ventilations, token);
  });

  const setPermissionsAndRelogin = (accessIds) => {
    updateUserAccounatApi({
      userId,
      accessIds,
      ventilations,
      referentielIds: null,
      token,
    });

    cy.visit("/logout");
    cy.visit("/connexion");
    cy.get('input[formcontrolname="email"]').type(user.email);
    cy.get('input[formcontrolname="password"]').type(user.password);
    cy.get('input[type="submit"]').click();
    cy.location("pathname", { timeout: 60000 }).should(
      "not.include",
      "/connexion",
    );
  };

  const checkToolsMenu = (toolToNotCheck = []) => {
    //Chek all tools are present
    cy.get(".menu-item .tools")
      .should("exist")
      .click()
      .get(".sub-tools")
      .within(() => {
        menuContentTools.forEach((tool) => {
          if (!toolToNotCheck.includes(tool)) {
            if (
              tool === "Les extracteurs" ||
              tool === "Référentiels de temps moyens"
            ) {
              cy.get("a").should("contain", tool); //.should("be.visible");
            } else {
              cy.get("p").contains(tool).should("be.visible");
            }
          }
        });
      });
    // Close the tools menu
    cy.get(".menu-item .tools").should("exist").click();
  };

  it("User with access to specific pages should not have access to others", () => {
    cy.wrap(accessUrlList).each((access) => {
      if (access.url === undefined) {
        return;
      }

      // Backend uses decimal IDs (1.1 = reader, 1.2 = writer)
      // Also need function access (8, 9, 10) to view data
      const pageAccessIds = [access.id + 0.1, access.id + 0.2];
      const functionAccessIds = [8, 9, 10];
      const accessIds = [...pageAccessIds, ...functionAccessIds];

      setPermissionsAndRelogin(accessIds);

      cy.visit(access.url);
      cy.location("pathname").should("include", access.url);

      cy.wrap(accessUrlList).each((otherAccess) => {
        if (
          otherAccess.url === undefined ||
          otherAccess.url === access.url
        ) {
          return;
        }

        const isSimulatorCrossCheck =
          (access.url === "/simulateur" &&
            otherAccess.url === "/simulateur-sans-donnees") ||
          (access.url === "/simulateur-sans-donnees" &&
            otherAccess.url === "/simulateur");

        if (isSimulatorCrossCheck) {
          cy.visit("/simulateur", { failOnStatusCode: false });
          cy.location("pathname").should("include", "/simulateur");

          if (access.url === "/simulateur-sans-donnees") {
            cy.contains("p.circle-disable", /avec les données d.A-JUST/);
          } else {
            cy.contains("p.circle-disable", "pour une autre activité");
          }
        } else {
          cy.visit(otherAccess.url, { failOnStatusCode: false });
          cy.location("pathname").should(
            "not.include",
            otherAccess.url.replace(/^\//, ""),
          );
        }
      });
    });
  });

  it("User with specific access should only see allowed menu items + help is always accessible", () => {
    cy.wrap(accessUrlList).each((access) => {
      if (access.label === "Temps moyens" || access.url === undefined) {
        return;
      }

      const pageAccessIds = [access.id + 0.1, access.id + 0.2];
      const functionAccessIds = [8, 9, 10];
      const accessIds = [...pageAccessIds, ...functionAccessIds];

      cy.log(`Testing menu for ${access.label}`);

      setPermissionsAndRelogin(accessIds);

      cy.visit(access.url);
      cy.location("pathname").should("include", access.url);

      cy.get("#side-menu-bar .menu-scrollable .menu-item.top a").should(
        "contain.text",
        access.label,
      );

      cy.wrap(accessUrlList).each((otherAccess) => {
        if (
          otherAccess.label === "Temps moyens" ||
          otherAccess.label === undefined ||
          otherAccess.label === access.label
        ) {
          return;
        }

        cy.get("#side-menu-bar .menu-scrollable .menu-item.top a").should(
          "not.contain.text",
          otherAccess.label,
        );
      });

      cy.get(".help-section .help-button").should("exist");

      const toolToNotCheck = ["Référentiels de temps moyens"];
      if (
        access.label !== "Ventilateur" &&
        access.label !== "Données d'activité"
      ) {
        toolToNotCheck.push("Les extracteurs");
      }
      checkToolsMenu(toolToNotCheck);
    });
  });

  it("Give only access to Magistrat and check user does not have access to Greffier and Contractuel datas on panorama", () => {
    const accessUrls = accessUrlList.flatMap((access) => [access.id + 0.1, access.id + 0.2]);
    const accessFonctions = accessFonctionsList
      .filter((access) => access.label === "Accès aux magistrats")
      .map((access) => access.id);
    const accessIds = [...accessUrls, ...accessFonctions];

    updateUserAccounatApi({
      userId,
      accessIds,
      ventilations,
      token,
    });

    cy.wait(3000);
    cy.visit('/logout');
    cy.wait(1000);
    cy.visit('/connexion');
    cy.get('input[formcontrolname="email"]').type(user.email);
    cy.get('input[formcontrolname="password"]').type(user.password);
    cy.get('input[type="submit"]').click();
    cy.wait(2000);

    cy.visit("/panorama");
    cy.wait(2000);
    cy.location("pathname").should("contain", "/panorama");

    // Check workforce-composition if it exists
    cy.get('.workforce-panel').then($panel => {
      if ($panel.find('workforce-composition .cards .category').length > 0) {
        cy.get(".workforce-panel workforce-composition .cards .category")
          .should("not.contain.text", "Greffe")
          .should("not.contain.text", "Autour du magistrat");
      }
    });

    // Check records-update if it exists
    cy.get('.workforce-panel').then($panel => {
      if ($panel.find('.records-update .category').length > 0) {
        cy.get(".workforce-panel .records-update .category")
          .should("not.contain.text", "Greffe")
          .should("not.contain.text", "Autour du magistrat");
      }
    });

    checkToolsMenu();
  });

  it("Give only access to Greffier and check user does not have access to Magistrat and Contractuel datas on panorama", () => {
    const accessUrls = accessUrlList.flatMap((access) => [access.id + 0.1, access.id + 0.2]);
    const accessFonctions = accessFonctionsList
      .filter((access) => access.label === "Accès aux greffiers")
      .map((access) => access.id);
    const accessIds = [...accessUrls, ...accessFonctions];

    updateUserAccounatApi({
      userId,
      accessIds,
      ventilations,
      token,
    });

    cy.wait(3000);
    cy.visit('/logout');
    cy.wait(1000);
    cy.visit('/connexion');
    cy.get('input[formcontrolname="email"]').type(user.email);
    cy.get('input[formcontrolname="password"]').type(user.password);
    cy.get('input[type="submit"]').click();
    cy.wait(2000);

    cy.visit("/panorama");
    cy.wait(2000);
    cy.location("pathname").should("contain", "/panorama");

    // Check workforce-composition if it exists
    cy.get('.workforce-panel').then($panel => {
      if ($panel.find('workforce-composition .cards .category').length > 0) {
        cy.get(".workforce-panel workforce-composition .cards .category")
          .should("not.contain.text", "Siège")
          .should("not.contain.text", "Autour du magistrat");
      }
    });

    // Check records-update if it exists
    cy.get('.workforce-panel').then($panel => {
      if ($panel.find('.records-update .category').length > 0) {
        cy.get(".workforce-panel .records-update .category")
          .should("not.contain.text", "Siège")
          .should("not.contain.text", "Autour du magistrat");
      }
    });

    checkToolsMenu();
  });

  it("Give only access to Contractuel and check user does not have access to Magistrat and Greffier datas on panorama", () => {
    const accessUrls = accessUrlList.flatMap((access) => [access.id + 0.1, access.id + 0.2]);
    const accessFonctions = accessFonctionsList
      .filter((access) => access.label === "Accès aux contractuels")
      .map((access) => access.id);
    const accessIds = [...accessUrls, ...accessFonctions];

    updateUserAccounatApi({
      userId,
      accessIds,
      ventilations,
      token,
    });

    cy.wait(3000);
    cy.visit('/logout');
    cy.wait(1000);
    cy.visit('/connexion');
    cy.get('input[formcontrolname="email"]').type(user.email);
    cy.get('input[formcontrolname="password"]').type(user.password);
    cy.get('input[type="submit"]').click();
    cy.wait(2000);

    cy.visit("/panorama");
    cy.wait(2000);
    cy.location("pathname").should("contain", "/panorama");

    // Check workforce-composition if it exists
    cy.get('.workforce-panel').then($panel => {
      if ($panel.find('workforce-composition .cards .category').length > 0) {
        cy.get(".workforce-panel workforce-composition .cards .category")
          .should("not.contain.text", "Siège")
          .should("not.contain.text", "Greffe");
      }
    });

    // Check records-update if it exists
    cy.get('.workforce-panel').then($panel => {
      if ($panel.find('.records-update .category').length > 0) {
        cy.get(".workforce-panel .records-update .category")
          .should("not.contain.text", "Siège")
          .should("not.contain.text", "Greffe");
      }
    });

    checkToolsMenu();
  });

  it("Give only access to Magistrat and check user does not have access to Greffier datas on cockpit", () => {
    const accessUrls = accessUrlList.flatMap((access) => [access.id + 0.1, access.id + 0.2]);
    const accessFonctions = accessFonctionsList
      .filter((access) => access.label === "Accès aux magistrats")
      .map((access) => access.id);
    const accessIds = [...accessUrls, ...accessFonctions];

    updateUserAccounatApi({
      userId,
      accessIds,
      ventilations,
      token,
    });

    cy.wait(3000);
    cy.visit('/logout');
    cy.wait(1000);
    cy.visit('/connexion');
    cy.get('input[formcontrolname="email"]').type(user.email);
    cy.get('input[formcontrolname="password"]').type(user.password);
    cy.get('input[type="submit"]').click();
    cy.wait(2000);

    cy.visit("/cockpit");
    cy.wait(2000);
    cy.location("pathname").should("contain", "/cockpit");

    cy.get('body').then($body => {
      if ($body.find('.sub-main-header .categories-switch').length > 0) {
        cy.get(".sub-main-header .categories-switch")
          .should("not.contain.text", "Greffe")
          .should("not.contain.text", "Autour du magistrat");
      }
    });

    checkToolsMenu();
  });

  it("Give only access to Greffier and check user does not have access to Magistrat datas on cockpit", () => {
    const accessUrls = accessUrlList.flatMap((access) => [access.id + 0.1, access.id + 0.2]);
    const accessFonctions = accessFonctionsList
      .filter((access) => access.label === "Accès aux greffiers")
      .map((access) => access.id);
    const accessIds = [...accessUrls, ...accessFonctions];

    updateUserAccounatApi({
      userId,
      accessIds,
      ventilations,
      token,
    });

    cy.wait(3000);
    cy.visit('/logout');
    cy.wait(1000);
    cy.visit('/connexion');
    cy.get('input[formcontrolname="email"]').type(user.email);
    cy.get('input[formcontrolname="password"]').type(user.password);
    cy.get('input[type="submit"]').click();
    cy.wait(2000);

    cy.visit("/cockpit");
    cy.wait(2000);
    cy.location("pathname").should("contain", "/cockpit");

    cy.get('body').then($body => {
      if ($body.find('.sub-main-header .categories-switch').length > 0) {
        cy.get(".sub-main-header .categories-switch")
          .should("not.contain.text", "Siège")
          .should("not.contain.text", "Autour du magistrat");
      }
    });

    checkToolsMenu();
  });

  it("Give only access to Magistrat and check user does not have access to Greffier and Contractuel datas on ventilateur", () => {
    const accessUrls = accessUrlList.flatMap((access) => [access.id + 0.1, access.id + 0.2]);
    const accessFonctions = accessFonctionsList
      .filter((access) => access.label === "Accès aux magistrats")
      .map((access) => access.id);
    const accessIds = [...accessUrls, ...accessFonctions];

    updateUserAccounatApi({
      userId,
      accessIds,
      ventilations,
      token,
    });

    cy.wait(3000);
    cy.visit('/logout');
    cy.wait(1000);
    cy.visit('/connexion');
    cy.get('input[formcontrolname="email"]').type(user.email);
    cy.get('input[formcontrolname="password"]').type(user.password);
    cy.get('input[type="submit"]').click();
    cy.wait(2000);

    cy.visit("/ventilations");
    cy.wait(2000);
    cy.location("pathname").should("contain", "/ventilations");

    cy.get('body').then($body => {
      if ($body.find('.title .checkbox-button').length > 0) {
        cy.get(".title .checkbox-button")
          .should("not.contain.text", "Greffe")
          .should("not.contain.text", "Autour du magistrat");
      }
    });

    checkToolsMenu();
  });

  it("Give only access to Greffier and check user does not have access to Magistrat and Contractuel datas on ventilateur", () => {
    const accessUrls = accessUrlList.flatMap((access) => [access.id + 0.1, access.id + 0.2]);
    const accessFonctions = accessFonctionsList
      .filter((access) => access.label === "Accès aux greffiers")
      .map((access) => access.id);
    const accessIds = [...accessUrls, ...accessFonctions];

    updateUserAccounatApi({
      userId,
      accessIds,
      ventilations,
      token,
    });

    cy.wait(3000);
    cy.visit('/logout');
    cy.wait(1000);
    cy.visit('/connexion');
    cy.get('input[formcontrolname="email"]').type(user.email);
    cy.get('input[formcontrolname="password"]').type(user.password);
    cy.get('input[type="submit"]').click();
    cy.wait(2000);

    cy.visit("/ventilations");
    cy.wait(2000);
    cy.location("pathname").should("contain", "/ventilations");

    cy.get('body').then($body => {
      if ($body.find('.title .checkbox-button').length > 0) {
        cy.get(".title .checkbox-button")
          .should("not.contain.text", "Siège")
          .should("not.contain.text", "Autour du magistrat");
      }
    });

    checkToolsMenu();
  });

  it("Give only access to Contractuel and check user does not have access to Magistrat and Greffier datas on ventilateur", () => {
    const accessUrls = accessUrlList.flatMap((access) => [access.id + 0.1, access.id + 0.2]);
    const accessFonctions = accessFonctionsList
      .filter((access) => access.label === "Accès aux contractuels")
      .map((access) => access.id);
    const accessIds = [...accessUrls, ...accessFonctions];

    updateUserAccounatApi({
      userId,
      accessIds,
      ventilations,
      token,
    });

    cy.wait(3000);
    cy.visit('/logout');
    cy.wait(1000);
    cy.visit('/connexion');
    cy.get('input[formcontrolname="email"]').type(user.email);
    cy.get('input[formcontrolname="password"]').type(user.password);
    cy.get('input[type="submit"]').click();
    cy.wait(2000);

    cy.visit("/ventilations");
    cy.wait(2000);
    cy.location("pathname").should("contain", "/ventilations");

    cy.get('body').then($body => {
      if ($body.find('.title .checkbox-button').length > 0) {
        cy.get(".title .checkbox-button")
          .should("not.contain.text", "Siège")
          .should("not.contain.text", "Greffe");
      }
    });

    checkToolsMenu();
  });

  it("Give only access to Magistrat and check user does not have access to Greffier and Contractuel datas on workforce extractor", () => {
    const accessUrls = accessUrlList.flatMap((access) => [access.id + 0.1, access.id + 0.2]);
    const accessFonctions = accessFonctionsList
      .filter((access) => access.label === "Accès aux magistrats")
      .map((access) => access.id);
    const accessIds = [...accessUrls, ...accessFonctions];

    updateUserAccounatApi({
      userId,
      accessIds,
      ventilations,
      token,
    });

    cy.wait(3000);
    cy.visit('/logout');
    cy.wait(1000);
    cy.visit('/connexion');
    cy.get('input[formcontrolname="email"]').type(user.email);
    cy.get('input[formcontrolname="password"]').type(user.password);
    cy.get('input[type="submit"]').click();
    cy.wait(2000);

    cy.visit("/dashboard");
    cy.wait(2000);
    cy.location("pathname").should("contain", "/dashboard");

    cy.get('body').then($body => {
      if ($body.find('aj-extractor-ventilation .exportateur-container .category-select').length > 0) {
        cy.get("aj-extractor-ventilation .exportateur-container .category-select")
          .click();
        cy.get(".cdk-overlay-pane")
          .should("contain.text", "Siège")
          .should("not.contain.text", "Greffe")
          .should("not.contain.text", "Equipe Autour du magistrat");
        cy.get("body").click(0, 0);
      }
    });

    checkToolsMenu();
  });

  it("Give only access to Greffier and check user does not have access to Magistrat and Contractuel datas on workforce extractor", () => {
    const accessUrls = accessUrlList.flatMap((access) => [access.id + 0.1, access.id + 0.2]);
    const accessFonctions = accessFonctionsList
      .filter((access) => access.label === "Accès aux greffiers")
      .map((access) => access.id);
    const accessIds = [...accessUrls, ...accessFonctions];

    updateUserAccounatApi({
      userId,
      accessIds,
      ventilations,
      token,
    });

    cy.wait(3000);
    cy.visit('/logout');
    cy.wait(1000);
    cy.visit('/connexion');
    cy.get('input[formcontrolname="email"]').type(user.email);
    cy.get('input[formcontrolname="password"]').type(user.password);
    cy.get('input[type="submit"]').click();
    cy.wait(2000);

    cy.visit("/dashboard");
    cy.wait(2000);
    cy.location("pathname").should("contain", "/dashboard");

    cy.get('body').then($body => {
      if ($body.find('aj-extractor-ventilation .exportateur-container .category-select').length > 0) {
        cy.get("aj-extractor-ventilation .exportateur-container .category-select")
          .click();
        cy.get(".cdk-overlay-pane")
          .should("contain.text", "Greffe")
          .should("not.contain.text", "Siège")
          .should("not.contain.text", "Equipe Autour du magistrat");
        cy.get("body").click(0, 0);
      }
    });

    checkToolsMenu();
  });

  it("Give only access to Contractuel and check user does not have access to Magistrat and Greffier datas on workforce extractor", () => {
    const accessUrls = accessUrlList.flatMap((access) => [access.id + 0.1, access.id + 0.2]);
    const accessFonctions = accessFonctionsList
      .filter((access) => access.label === "Accès aux contractuels")
      .map((access) => access.id);
    const accessIds = [...accessUrls, ...accessFonctions];

    updateUserAccounatApi({
      userId,
      accessIds,
      ventilations,
      token,
    });

    cy.wait(3000);
    cy.visit('/logout');
    cy.wait(1000);
    cy.visit('/connexion');
    cy.get('input[formcontrolname="email"]').type(user.email);
    cy.get('input[formcontrolname="password"]').type(user.password);
    cy.get('input[type="submit"]').click();
    cy.wait(2000);

    cy.visit("/dashboard");
    cy.wait(2000);
    cy.location("pathname").should("contain", "/dashboard");

    cy.get('body').then($body => {
      if ($body.find('aj-extractor-ventilation .exportateur-container .category-select').length > 0) {
        cy.get("aj-extractor-ventilation .exportateur-container .category-select")
          .click();
        cy.get(".cdk-overlay-pane")
          .should("contain.text", "Equipe autour du magistrat")
          .should("not.contain.text", "Siège")
          .should("not.contain.text", "Greffe");
        cy.get("body").click(0, 0);
      }
    });

    checkToolsMenu();
  });
});