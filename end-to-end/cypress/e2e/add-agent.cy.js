/**
 * Convertit une date en suite de chiffres JJMMAAAA à saisir dans le champ
 * manuel (manualInput) du composant aj-date-select. Le masque interne ajoute
 * automatiquement les "/" : on ne tape donc que les chiffres.
 */
const toInputDate = (d) =>
  `${(d.getDate() + "").padStart(2, "0")}${(d.getMonth() + 1 + "").padStart(
    2,
    "0"
  )}${d.getFullYear()}`;

const toMaskedDate = (date) =>
  toInputDate(date).replace(/^(\d{2})(\d{2})(\d{4})$/, "$1/$2/$3");

const expectSavedDate = (value, expectedDate, label) => {
  expect(value, label).to.be.a("string").and.not.be.empty;
  expect(toInputDate(new Date(value)), label).to.eq(toInputDate(expectedDate));
};

describe("Ajout d'un agent", () => {
  let arrivalDate;
  let leavingDate;

  before(() => {
    leavingDate = new Date();
    arrivalDate = new Date(leavingDate);
    arrivalDate.setMonth(arrivalDate.getMonth() - 3);

    cy.login();
    cy.visit("/ventilations");
  });

  it("Check that we can access the add agent page", () => {
    cy.get("button.add-collaborator")
      .should("be.visible")
      .should("contain.text", "Ajouter un agent")
      .click();
    cy.wait(5000);
    cy.location("pathname").should("include", "/resource-humaine");
  });

  it("Check that we can cancel", () => {
    cy.get(".sticky-action-footer").within(() => {
      cy.get("button").first().click();
    });
  });

  it("Add first name", () => {
    cy.get(".second-row");
    cy.get("#firstName").type("Agent");
  });

  it("Add last name", () => {
    cy.get(".second-row");
    cy.get("#lastName").type("test");
  });

  it("Add matricule", () => {
    cy.get(".second-row");
    cy.get("#matricule").type("123456");
  });

  it("Select incoming date", () => {
    cy.intercept("POST", "**/human-resources/update-hr").as("saveArrivalDate");

    cy.get("cover-profil-details .dates")
      .find("aj-date-select")
      .first()
      .find("input.manual-input")
      .clear()
      .type(toInputDate(arrivalDate))
      .should("have.value", toMaskedDate(arrivalDate))
      .blur();

    cy.wait("@saveArrivalDate", { timeout: 60000 }).then(({ request, response }) => {
      expect(response.statusCode).to.eq(200);
      expectSavedDate(request.body.hr.dateStart, arrivalDate, "submitted arrival date");
      expectSavedDate(response.body.data.dateStart, arrivalDate, "saved arrival date");
    });
    cy.get("cover-profil-details .dates aj-date-select")
      .first()
      .find("input.manual-input")
      .should("not.have.value", "");
  });

  it("Select leaving date", () => {
    cy.intercept("POST", "**/human-resources/update-hr").as("saveLeavingDate");

    cy.get("cover-profil-details .dates")
      .find("aj-date-select")
      .eq(1)
      .find("input.manual-input")
      .clear()
      .type(toInputDate(leavingDate))
      .should("have.value", toMaskedDate(leavingDate))
      .blur();

    cy.wait("@saveLeavingDate", { timeout: 60000 }).then(({ request, response }) => {
      expect(response.statusCode).to.eq(200);
      expectSavedDate(request.body.hr.dateEnd, leavingDate, "submitted leaving date");
      expectSavedDate(response.body.data.dateEnd, leavingDate, "saved leaving date");
      expectSavedDate(response.body.data.dateStart, arrivalDate, "retained arrival date");
    });
  });

  it("Select Catégorie", () => {
    cy.get(".grid-triple")
      .get(".admin-element")
      .first()
      .within(() => {
        cy.get("select").select("Magistrat");
      });
  });

  it("Select Fonction", () => {
    cy.get(".grid-triple")
      .get(".admin-element")
      .eq(1)
      .within(() => {
        cy.get("select").select("JUGE");
      });
  });

  it("Set ETPT", () => {
    cy.get(".grid-triple")
      .get(".admin-element")
      .eq(2)
      .within(() => {
        cy.get("input").type("0.5");
      });
  });

  // Regarder pourquoi ce test ne fonctionne pas en CI/CD
  // it("Check 'Feuille des temps' download works", () => {
  //   cy.get('#admin').within(() => {
  //       cy.get('.top')
  //         .get('.drop-down-container')
  //         .get('#drop-down2')
  //         .click()
  //       cy.get('#timesheet')
  //         .get('.download')
  //         .click()
  //   })
  //   cy.wait(20000)
  //   cy.task('logDownloads');
  //   // Check file is downloaded
  //   cy.verifyDownload('.xlsx', { contains: true })
  // })

  // Regarder pourquoi ce test ne fonctionne pas en CI/CD
  // it("Check user can download 'Calculatrice des temps de ventilations'", () => {
  //   cy.get('.activities').within(() =>
  //       cy.get('.top')
  //       .get('.download-calculatrice')
  //       .click()
  //   )
  //   // Check file is downloaded
  //   cy.verifyDownload('Calculatrice_de_ventilation_du_temps_par_activité_A-JUST_MAG_et_GRF.xlsx', { timeout: 40000 })
  // })

  it("Add activities", () => {
    cy.window().then((win) => {
      cy.stub(win, "prompt")
        .callsFake((message) => {
          expect(message).to.equal("Nouveau pourcentage ?");
          return "25";
        })
        .as("activityPercentage");
    });

    // Only grouped jurisdictions have an Arrondissement overview to leave.
    cy.get("add-ventilation .activities-panel").should("exist");
    cy.get("add-ventilation").then(($form) => {
      if ($form.find(".arrondissement-header-container").length) {
        cy.get(
          'add-ventilation .arrondissement-header[data-backup-id]:not([data-backup-id=""])'
        )
          .first()
          .click()
          .should("have.class", "selected");
      }
    });

    for (let i = 0; i < 4; i++) {
      cy.get("add-ventilation .activities-panel > .sub-item")
        .eq(i)
        .find("progression-bar .background-bar")
        .click();
      cy.get(
        "add-ventilation .sub-panel-activites .group-sub-item progression-bar .background-bar"
      )
        .first()
        .click();
    }

    cy.get("@activityPercentage").should("have.callCount", 4);
    cy.get("add-ventilation panel-activities > .progress-bar")
      .invoke("text")
      .should("match", /:\s*100\s*%/);
  });

  it("Check if we can add a start date to the situation", () => {
    cy.get(".bottom-container")
      .find(".date-start .date-start-content aj-date-select")
      .find("input.manual-input")
      .clear()
      .type(toInputDate(arrivalDate))
      .should("have.value", toMaskedDate(arrivalDate))
      .blur();
  });

  it("Checking that we can add unavailabilities", () => {
    const startDate = new Date(leavingDate);
    const endDate = new Date(leavingDate);

    startDate.setMonth(startDate.getMonth() - 1);

    cy.intercept("POST", "**/human-resources/update-hr").as("saveUnavailability");

    cy.get(".bottom-container")
      .find(".indisponibilities .indispo-header button")
      .click();

    cy.get("aj-popup").within(() => {
      cy.get("select").select("Congé maladie ordinaire");

      cy.get("aj-date-select")
        .first()
        .find("input.manual-input")
        .clear()
        .type(toInputDate(startDate))
        .blur();

      cy.get("aj-date-select")
        .eq(1)
        .find("input.manual-input")
        .clear()
        .type(toInputDate(endDate))
        .blur();

      cy.get("#input-indispo").clear().type(100);

      cy.get(".actions button").contains("Enregistrer").click();
    });

    cy.wait("@saveUnavailability", { timeout: 60000 }).then(({ response }) => {
      expect(response.statusCode).to.eq(200);
      expectSavedDate(response.body.data.dateStart, arrivalDate, "retained arrival date");
    });
    cy.get("aj-popup .popup").should("not.exist");
    cy.get("aj-big-loader").should("not.exist");
  });

  it("Register new agent and his activities", () => {
    cy.intercept("POST", "**/human-resources/update-hr").as("saveAgent");
    cy.intercept("GET", "**/human-resources/read-hr/*").as("reloadAgent");

    cy.get("cover-profil-details .dates aj-date-select")
      .first()
      .find("input.manual-input")
      .should("not.have.value", "");

    cy.contains(".sticky-action-footer button", /^\s*Enregistrer\s*$/).click();

    cy.wait("@saveAgent", { timeout: 60000 }).then(({ request, response }) => {
      expect(response.statusCode).to.eq(200);
      expectSavedDate(request.body.hr.dateStart, arrivalDate, "submitted arrival date");
      expect(request.body.hr.situations).to.be.an("array").and.not.be.empty;
    });
    cy.wait("@reloadAgent", { timeout: 60000 })
      .its("response.statusCode")
      .should("eq", 200);
    cy.get(".sticky-action-footer").should("not.exist");
    cy.get("aj-popup .popup").should("not.exist");
  });

  it("Check 'return' button works", () => {
    cy.contains(".first-row aj-back-button a", /^\s*Retour\s*$/).click();
    cy.location("pathname").should("eq", "/ventilations");
  });
});
