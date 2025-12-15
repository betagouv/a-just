import { normalizeDate, getShortMonthString } from "../../support/utils/dates";
import { updateHumanResourcesApi, loginApi, getUserDataApi, resetToDefaultPermissions } from "../../support/api";
import { attachAJustContext } from "../../support/ajust-context";
import user from "../../fixtures/user.json";

describe("Panorama page", () => {
  let userId;
  let token;
  let ventilations = [];

  before(() => {
    // "Ceinture": Explicitly set required permissions before tests
    return loginApi(user.email, user.password).then((resp) => {
      userId = resp.body.user.id;
      token = resp.body.token;

      return getUserDataApi(token).then((resp) => {
        ventilations = resp.body.data.backups.map((v) => v.id);

        // Ensure full default permissions (including reaffectator needed for workforce-composition)
        return resetToDefaultPermissions(userId, ventilations, token).then(() => {
          cy.login();
        });
      });
    });
  });

  after(() => {
    // "Bretelles": Always restore default permissions after tests
    return loginApi(user.email, user.password).then((resp) => {
      userId = resp.body.user.id;
      token = resp.body.token;

      return getUserDataApi(token).then((resp) => {
        ventilations = resp.body.data.backups.map((v) => v.id);
        return resetToDefaultPermissions(userId, ventilations, token);
      });
    });
  });

  it("Check panorama page load", () => {
    cy.visit("/panorama");
    cy.wait(1000);
    cy.url().should("include", "/panorama");
    
    // Attach A-JUST context AFTER page visit so localStorage is populated
    attachAJustContext();
    
    // Force Cypress to wait for the context file to be written by reading it back
    // This ensures the write completes before the test fails
    cy.task('readContextFile', 'cypress/reports/test-contexts.json').then((contexts) => {
      const testKey = 'panorama page check panorama page load';
      
      // Verify the context exists and has content
      expect(contexts).to.have.property(testKey);
      expect(contexts[testKey]).to.exist.and.not.be.empty;
      
      cy.log(`✅ Context successfully saved for: "${testKey}"`);
      
      // NOW fail the test - context is guaranteed to be saved
      expect(false).to.equal(true, 'TEMPORARY TEST FAILURE: Verify A-JUST context (user, backup, rights) appears in CI report');
    });
  });

  it("Should display main menu and submenu items", () => {
    cy.get(".menu-scrollable a").as("menuLinks");

    cy.get("@menuLinks").should("contain.text", "Panorama");
    cy.get("@menuLinks").should("contain.text", "Ventilateur");
    cy.get("@menuLinks").should("contain.text", "Données d'activité");
    cy.get("@menuLinks").should("contain.text", "Cockpit");
    cy.get("@menuLinks").should("contain.text", "Simulateur");
    cy.get("@menuLinks").should("contain.text", "Outils");

    // Check help button at bottom right (covers contact functionality)
    cy.get(".help-button").should("be.visible").should("contain.text", "Besoin d'aide");

    cy.get(".tools").click();
    cy.get(".sub-tools").within(() => {
      cy.contains("La nomenclature");
      cy.contains("La calculatrice");
      cy.contains("Les extracteurs");
      cy.contains("Référentiels de temps moyens");
    });
  });

  it("Should show 'Effectifs' and 'Données d'activité' tabs", () => {
    cy.get(".panorama-container .header-panorama")
      .should("contain.text", "Effectifs")
      .and("contain.text", "Données d'activité");
  });

  it("Should display the 3 'Effectifs' sections", () => {
    cy.get(".workforce-panel").within(() => {
      cy.get("h3").eq(0).should("contain.text", "Composition des effectifs");
      cy.get("h3").eq(1).should("contain.text", "Actualisation des fiches");
    });

    cy.get(".workforce-change")
      .should("contain.text", "changement")
      .and("contain.text", "effectifs");
  });

  it("Should display the 3 'Données d’activité' sections", () => {
    cy.get("activities-last-modifications h3").should(
      "contain.text",
      "Dernières modifications"
    );
    cy.get("activities-last-disponibilities h3").should(
      "contain.text",
      "Dernières données disponibles"
    );
    cy.get("activities-to-complete h3").should(
      "contain.text",
      "Les données d'activité à compléter"
    );
  });

  it("Should display 3 cards in 'Composition des effectifs'", () => {
    cy.get(".workforce-panel .cards .categoryType")
      .should("contain.text", "Siège")
      .and("contain.text", "Greffe")
      .and("contain.text", "Autour du magistrat");
  });

  it("Should show sub-categories and CLE for first 2 agent categories", () => {
    cy.get(".workforce-panel .cards .category").each(($el, index) => {
      if (index < 2) {
        cy.wrap($el).within(() => {
          cy.get(".middle").should("contain.text", "Personnels CLE");
          cy.get(".footer .subCategory .categoryType").as("subcats");
          cy.get("@subcats").should("contain.text", "Titulaire");
          cy.get("@subcats").should("contain.text", "Placé");
          cy.get("@subcats").should("contain.text", "Contractuel");
        });
      }
    });
  });

  it("Should save CLE values correctly", () => {
    const cleValues = ["4", "32", "10"];

    cleValues.forEach((value, index) => {
      cy.get(".workforce-panel workforce-composition .cards .category")
        .eq(index)
        .find(".middle input")
        .clear()
        .type(value);
      cy.get("body").click(0, 0);
    });

    cy.wait(3000);
    cy.reload();

    cleValues.forEach((expectedValue, index) => {
      cy.get(".workforce-panel workforce-composition .cards .category")
        .eq(index)
        .find(".middle input")
        .should("have.value", expectedValue);
    });
  });

  it("Add an agent of type 'Siege' and check that the number of siege agents is updated", () => {
    let actualNbSiege = 0;

    cy.get(".workforce-panel workforce-composition .cards .category")
      .eq(0)
      .get(".header .categoryType")
      .find("span")
      .eq(1)
      .invoke("text")
      .then((value) => {
        actualNbSiege = parseInt(value);
      });
  });

  it("Should display 3 cards in 'Actualisation des fiches'", () => {
    cy.get(".workforce-panel .category .content-wrapper")
      .should("contain.text", "Siège")
      .and("contain.text", "Greffe")
      .and("contain.text", "Autour du magistrat");
  });

  it("Should show 3 columns in 'Actualisation des fiches'", () => {
    cy.get(".workforce-panel .header-titles").within(() => {
      cy.get(".label").should("contain.text", "Effectifs");
      cy.get(".percent").should("contain.text", "% ventilé");
      cy.get(".update-title").should("contain.text", "Dernière MAJ");
    });
  });

  const verifyRedirectionWithFilter = (index, expectedFilterIndex) => {
    cy.get(".workforce-panel .category .dark-arrow").eq(index).click();

    cy.location("pathname").should("eq", "/ventilations");

    cy.get(".radio-border-left").each(($el, idx) => {
      const isSelected = idx === expectedFilterIndex;
      cy.wrap($el)
        .find("aj-radio-button")
        .should(isSelected ? "have.class" : "not.have.class", "selected");
    });

    cy.visit("/panorama");
    cy.location("pathname").should("eq", "/panorama");
  };

  it("Workforce actualisation - Click on 'Siège' and should be redirected to ventilateur with only 'Siège' filter active", () => {
    verifyRedirectionWithFilter(0, 0);
  });

  it("Workforce actualisation - Click on 'Greffe' and should be redirected to ventilateur with only 'Greffe' filter active", () => {
    verifyRedirectionWithFilter(1, 1);
  });

  it("Workforce actualisation - Click on 'EAM' and should be redirected to ventilateur with only 'EAM' filter active", () => {
    verifyRedirectionWithFilter(2, 2);
  });

  it("Should update the last update date in 'Actualisation des fiches' for 'Siège' after adding an agent", () => {
    cy.visit("/panorama");

    //  Add an agent via API
    const activities = [
      {
        percent: 100,
        contentieux: { id: 447, label: "Contentieux Social" },
      },
    ];
    const category = { id: 1, rank: 1, label: "Magistrat" };
    const dateStart = new Date().toISOString();
    const etp = 1;
    const fonction = {
      id: 22,
      rank: 1,
      code: "P",
      label: "PRÉSIDENT",
      category_detail: "M-TIT",
      position: "Titulaire",
      calculatriceIsActive: false,
    };
    const situations = [
      {
        activities,
        category,
        dateStart,
        etp,
        fonction,
      },
    ];
    const hrData = {
      firstName: "Agent",
      lastName: "Test",
      matricule: "123456",
      situations: situations,
      dateStart: new Date(),
    };

    updateHumanResourcesApi(hrData).then((response) => {
      expect(response.status).to.eq(200);
    });

    // Reload the page and verify the last update date is today's date
    cy.reload();
    cy.wait(2000);

    const today = new Date();
    const todayShort =
      today.getDate() +
      " " +
      getShortMonthString(today) +
      " " +
      today.getFullYear();

    cy.get(".workforce-panel .records-update .category")
      .eq(0)
      .find(".update")
      .invoke("text")
      .then((text) => {
        const updatedLastUpdateDate = text.trim();

        // Ensure the last update date is today's date
        expect(updatedLastUpdateDate).to.contain(todayShort);
      });
  });

  it("Should update the last update date in 'Actualisation des fiches' for 'Greffe' after adding an agent", () => {
    cy.visit("/panorama");

    // Add an agent via API
    const activities = [
      {
        percent: 100,
        contentieux: { id: 447, label: "Contentieux Social" },
      },
    ];
    const category = { id: 2, rank: 2, label: "Greffe" };
    const dateStart = new Date().toISOString();
    const etp = 1;
    const fonction = {
      id: 40,
      rank: 2,
      code: "A",
      label: "A",
      category_detail: "F-TIT",
      position: "Titulaire",
      calculatriceIsActive: false,
    };
    const situations = [
      {
        activities,
        category,
        dateStart,
        etp,
        fonction,
      },
    ];
    const hrData = {
      firstName: "Agent",
      lastName: "Test",
      matricule: "123456",
      situations: situations,
      dateStart: new Date(),
    };

    updateHumanResourcesApi(hrData).then((response) => {
      expect(response.status).to.eq(200);
    });

    // Reload the page and verify the last update date is today's date
    cy.reload();
    cy.wait(2000);

    const today = new Date();
    const todayShort =
      today.getDate() +
      " " +
      getShortMonthString(today) +
      " " +
      today.getFullYear();

    cy.get(".workforce-panel .records-update .category")
      .eq(1)
      .find(".update")
      .invoke("text")
      .then((text) => {
        const updatedLastUpdateDate = text.trim();

        // Ensure the last update date is today's date
        expect(updatedLastUpdateDate).to.contain(todayShort);
      });
  });

  it("Should update the last update date in 'Actualisation des fiches' for 'EAM' after adding an agent", () => {
    cy.visit("/panorama");

    // Add an agent via API
    const activities = [
      {
        percent: 100,
        contentieux: { id: 447, label: "Contentieux Social" },
      },
    ];
    const category = { id: 3, rank: 3, label: "EAM" }; // Catégorie EAM
    const dateStart = new Date().toISOString();
    const etp = 1;
    const fonction = {
      id: 32,
      rank: 1,
      code: "AS",
      label: "ASSISTANT SPECIALISE",
      category_detail: "C",
      position: "Contractuel",
      calculatriceIsActive: false,
    };
    const situations = [
      {
        activities,
        category,
        dateStart,
        etp,
        fonction,
      },
    ];

    const hrData = {
      firstName: "Agent",
      lastName: "Test",
      matricule: "123456",
      situations: situations,
      dateStart: new Date(),
    };

    updateHumanResourcesApi(hrData).then((response) => {
      expect(response.status).to.eq(200);
    });

    // Reload the page and verify the last update date is today's date
    cy.reload();
    cy.wait(2000);

    const today = new Date();
    const todayShort =
      today.getDate() +
      " " +
      getShortMonthString(today) +
      " " +
      today.getFullYear();

    cy.get(".workforce-panel .records-update .category")
      .eq(2)
      .find(".update")
      .invoke("text")
      .then((text) => {
        const updatedLastUpdateDate = text.trim();

        // Ensure the last update date is today's date
        expect(updatedLastUpdateDate).to.contain(todayShort);
      });
  });

  it("Should add an agent of category 'Siège' via API and verify in 'Panorama' the number of agent and assocaited ETP have inscreased of 1", () => {
    cy.visit("/panorama");

    let currentEtptSiege = 0;
    let currentNbSiege = 0;

    // Get current Siege ETPT
    cy.get(".workforce-panel .cards .category")
      .eq(0)
      .find(".header .etp")
      .invoke("text")
      .then((text) => {
        currentEtptSiege = parseInt(text);
        expect(currentEtptSiege).to.be.greaterThan(0);
      });

    // Get current Siege number of agents
    cy.get(".workforce-panel .cards .category")
      .eq(0)
      .find(".header .categoryType span")
      .eq(1)
      .invoke("text")
      .then((text) => {
        currentNbSiege = parseInt(text);
        expect(currentNbSiege).to.be.greaterThan(0);
      });

    const activities = [
      {
        percent: 100,
        contentieux: { id: 447, label: "Contentieux Social" },
      },
      {
        percent: 100,
        contentieux: { id: 448, label: "Départage prud'homal" },
      },
    ];
    const category = { id: 1, rank: 1, label: "Magistrat" };
    const dateStart = normalizeDate(new Date());
    const etp = 1;
    const fonction = {
      id: 22,
      rank: 1,
      code: "P",
      label: "PRÉSIDENT",
      category_detail: "M-TIT",
      position: "Titulaire",
      calculatriceIsActive: false,
    };
    const situations = [
      {
        activities,
        category,
        dateStart,
        etp,
        fonction,
      },
    ];

    const hrData = {
      firstName: "Agent",
      lastName: "Test",
      matricule: "123456",
      situations: situations,
      dateStart: new Date(),
    };
    // Add a Siege agent
    updateHumanResourcesApi(hrData).then((response) => {
      expect(response.status).to.eq(200);
    });

    cy.reload();

    cy.wait(2000);

    // Back to panorama
    cy.visit("/panorama");

    // Check the agent is added in the "Composition des effectifs" section
    cy.get(".workforce-panel .cards .category")
      .eq(0)
      .find(".header .etp")
      .invoke("text")
      .then((text) => {
        const updatedNbSiege = parseInt(text);
        expect(updatedNbSiege).to.be.equal(currentEtptSiege + 1); // Ensure the number of Siege agent increased
      });

    cy.get(".workforce-panel .cards .category")
      .eq(0)
      .find(".header .categoryType span")
      .eq(1)
      .invoke("text")
      .then((text) => {
        const updatedEtptSiege = parseInt(text);
        expect(updatedEtptSiege).to.be.equal(currentNbSiege + 1); // Ensure the Siege ETP increased
      });
  });

  it("Should add an agent of category 'Greffe' via API and verify in 'Panorama' the number of agent and assocaited ETP have inscreased of 1", () => {
    cy.visit("/panorama");

    let currentEtptGreffe = 0;
    let currentNbGreffe = 0;
    // Get current Greffe ETPT
    cy.get(".workforce-panel .cards .category")
      .eq(1)
      .find(".header .etp")
      .invoke("text")
      .then((text) => {
        currentEtptGreffe = parseInt(text);
        expect(currentEtptGreffe).to.be.greaterThan(0);
      });
    // Get current Greffe number of agents
    cy.get(".workforce-panel .cards .category")
      .eq(1)
      .find(".header .categoryType span")
      .eq(1)
      .invoke("text")
      .then((text) => {
        currentNbGreffe = parseInt(text);
        expect(currentNbGreffe).to.be.greaterThan(0);
      });

    const activities = [
      {
        percent: 100,
        contentieux: { id: 447, label: "Contentieux Social" },
      },
      {
        percent: 100,
        contentieux: { id: 448, label: "Départage prud'homal" },
      },
    ];
    const category = { id: 2, rank: 2, label: "Greffe" };
    const dateStart = normalizeDate(new Date());
    const etp = 1;
    const fonction = {
      id: 40,
      rank: 2,
      code: "A",
      label: "A",
      category_detail: "F-TIT",
      position: "Titulaire",
      calculatriceIsActive: false,
    };
    const situations = [
      {
        activities,
        category,
        dateStart,
        etp,
        fonction,
      },
    ];
    const hrData = {
      firstName: "Agent",
      lastName: "Test",
      matricule: "123456",
      situations: situations,
      dateStart: new Date(),
    };

    // Add a Greffe agent
    updateHumanResourcesApi(hrData).then((response) => {
      expect(response.status).to.eq(200);
    });

    cy.reload();

    cy.wait(2000);

    // Back to panorama
    cy.visit("/panorama");

    // Check the agent is added in the "Composition des effectifs" section
    cy.get(".workforce-panel .cards .category")
      .eq(1)
      .find(".header .etp")
      .invoke("text")
      .then((text) => {
        const updatedNbGreffe = parseInt(text);
        expect(updatedNbGreffe).to.be.equal(currentEtptGreffe + 1); // Ensure the number of Greffe agent increased
      });

    cy.get(".workforce-panel .cards .category")
      .eq(1)
      .find(".header .categoryType span")
      .eq(1)
      .invoke("text")
      .then((text) => {
        const updatedEtptGreffe = parseInt(text);
        expect(updatedEtptGreffe).to.be.equal(currentNbGreffe + 1); // Ensure the Greffe ETP increased
      });
  });

  it("Should add an agent of category 'EAM' via API and verify in 'Panorama' the number of agent and assocaited ETP have inscreased of 1", () => {
    cy.visit("/panorama");

    let currentEtptEAM = 0;
    let currentNbEAM = 0;

    // Get current EAM ETPT
    cy.get(".workforce-panel .cards .category")
      .eq(2)
      .find(".header .etp")
      .invoke("text")
      .then((text) => {
        currentEtptEAM = parseInt(text);
        expect(currentEtptEAM).to.be.greaterThan(0);
      });
    // Get current EAM number of agents
    cy.get(".workforce-panel .cards .category")
      .eq(2)
      .find(".header .categoryType span")
      .eq(1)
      .invoke("text")
      .then((text) => {
        currentNbEAM = parseInt(text);
        expect(currentNbEAM).to.be.greaterThan(0);
      });

    const activities = [
      {
        percent: 100,
        contentieux: { id: 447, label: "Contentieux Social" },
      },
      {
        percent: 100,
        contentieux: { id: 448, label: "Départage prud'homal" },
      },
    ];
    const category = { id: 3, rank: 3, label: "EAM" };
    const dateStart = normalizeDate(new Date());
    const etp = 1;
    const fonction = {
      id: 32,
      rank: 1,
      code: "AS",
      label: "ASSISTANT SPECIALISE",
      category_detail: "C",
      position: "Contractuel",
      calculatriceIsActive: false,
    };
    const situations = [
      {
        activities,
        category,
        dateStart,
        etp,
        fonction,
      },
    ];

    const hrData = {
      firstName: "Agent",
      lastName: "Test",
      matricule: "123456",
      situations: situations,
      dateStart: new Date(),
    };

    // Add an EAM agent
    updateHumanResourcesApi(hrData).then((response) => {
      expect(response.status).to.eq(200);
    });

    cy.reload();
    cy.wait(2000);

    //Back to Panorama
    cy.visit("/panorama");

    // Check the agent is added in the "Composition des effectifs" section
    cy.get(".workforce-panel .cards .category")
      .eq(2)
      .find(".header .etp")
      .invoke("text")
      .then((text) => {
        const updatedNbEAM = parseInt(text);
        expect(updatedNbEAM).to.be.equal(currentEtptEAM + 1);
      });

    cy.get(".workforce-panel .cards .category")
      .eq(2)
      .find(".header .categoryType span")
      .eq(1)
      .invoke("text")
      .then((text) => {
        const updatedEtptEAM = parseInt(text);
        expect(updatedEtptEAM).to.be.equal(currentNbEAM + 1);
      });
  });

  const findAgentInPagination = (agentName, formattedArrivalDate) => {
    cy.get(".workforce-change .cards ul li").then(($list) => {
      const filtered = Cypress.$($list).filter((index, el) => {
        const name = Cypress.$(el).find("span.name").text().trim();
        return name === agentName;
      });

      if (filtered.length > 0) {
        // Si l'agent est trouvé, vérifie la date
        cy.wrap(filtered)
          .first()
          .within(() => {
            cy.get("div.date-section").should(
              "contain.text",
              formattedArrivalDate
            );
          });
      } else {
        // Si l'agent n'est pas trouvé, vérifie si le bouton "Suivant" est activé
        cy.get(".ngx-pagination .pagination-next:not(.disabled)").then(
          (nextButton) => {
            if (nextButton.length > 0) {
              // Clique sur "Suivant" et rappelle la fonction
              cy.wrap(nextButton).click();
              cy.wait(1000); // Attendre que la page suivante se charge
              findAgentInPagination(agentName, formattedArrivalDate);
            } else {
              throw new Error(`Agent "${agentName}" not found in any page.`);
            }
          }
        );
      }
    });
  };

  it("Should display the newly added agent in the 'Arrivées' column of 'Changement dans les effectifs'", () => {
    cy.visit("/panorama");

    // Add an agent via API with an arrival date in 8 days

    const activities = [
      {
        percent: 100,
        contentieux: { id: 447, label: "Contentieux Social" },
      },
    ];
    const category = { id: 1, rank: 1, label: "Magistrat" };
    const dateStart = new Date();
    dateStart.setDate(dateStart.getDate() + 8);
    const etp = 1;
    const fonction = {
      id: 22,
      rank: 1,
      code: "P",
      label: "PRÉSIDENT",
      category_detail: "M-TIT",
      position: "Titulaire",
      calculatriceIsActive: false,
    };
    const situations = [
      {
        activities,
        category,
        dateStart: dateStart,
        etp,
        fonction,
      },
    ];
    const hrData = {
      firstName: "Agent",
      lastName: "Test dateStart",
      matricule: "123456",
      situations: situations,
      dateStart: dateStart,
    };

    updateHumanResourcesApi(hrData).then((response) => {
      expect(response.status).to.eq(200);
    });

    // Reload the page and verify the agent appears in the "Arrivées" column
    cy.reload();
    cy.wait(2000);

    const arrivalDate = new Date();
    arrivalDate.setDate(arrivalDate.getDate() + 8);
    const formattedArrivalDate = `${arrivalDate.getDate()} ${getShortMonthString(
      arrivalDate
    )} ${arrivalDate.getFullYear()}`;

    cy.get(".workforce-change .buttons")
      .find("button")
      .contains("Arrivées")
      .click();
    cy.wait(1000); // Attendre que le filtre soit appliqué

    // Appelle la fonction pour chercher l'agent dans les pages
    findAgentInPagination("Agent Test dateStart", formattedArrivalDate);
  });

  it("Should display the newly added agent in the 'Départs' column of 'Changement dans les effectifs'", () => {
    cy.visit("/panorama");

    // Add an agent via API with a departure date in 8 days
    const activities = [
      {
        percent: 100,
        contentieux: { id: 447, label: "Contentieux Social" },
      },
    ];
    const category = { id: 1, rank: 1, label: "Magistrat" };
    const dateStart = new Date();
    dateStart.setDate(dateStart.getDate() - 8); // Date d'arrivé 8 jours avant
    const dateEnd = new Date();
    dateEnd.setDate(dateEnd.getDate() + 8); // Date de départ dans 8 jours
    const etp = 1;
    const fonction = {
      id: 22,
      rank: 1,
      code: "P",
      label: "PRÉSIDENT",
      category_detail: "M-TIT",
      position: "Titulaire",
      calculatriceIsActive: false,
    };
    const situations = [
      {
        activities,
        category,
        dateStart: dateStart,
        etp,
        fonction,
      },
    ];
    const hrData = {
      firstName: "Agent",
      lastName: "Test dateStop",
      matricule: "123456",
      situations: situations,
      dateStart: dateStart,
      dateEnd: dateEnd,
    };

    updateHumanResourcesApi(hrData).then((response) => {
      expect(response.status).to.eq(200);
    });

    // Reload the page and verify the agent appears in the "Départs" column
    cy.reload();
    cy.wait(2000);

    const departureDate = new Date();
    departureDate.setDate(departureDate.getDate() + 8);
    const formattedDepartureDate = `${departureDate.getDate()} ${getShortMonthString(
      departureDate
    )} ${departureDate.getFullYear()}`;

    cy.get(".workforce-change .buttons")
      .find("button")
      .contains("Départs")
      .click();
    cy.wait(1000); // Attendre que le filtre soit appliqué
    // Appelle la fonction pour chercher l'agent dans les pages
    findAgentInPagination("Agent Test dateStop", formattedDepartureDate);
  });
});
