import { getLastMonthApi } from "../../support/api";
import { getShortMonthString } from "../../support/utils/dates";

describe("Cockpit", () => {
  before(() => {
    cy.login();
    cy.visit("/cockpit");
    cy.wait(10000);
  });

  it("Check the name page is displayed", () => {
    cy.get(".title-with-doc").get("h3").should("contain.text", "Cockpit");
  });

  it("Check that the doc button is accessible", () => {
    cy.get(".top-header")
      .get(".top-header-back-title .title-with-doc")
      .get("aj-help-button")
      .click();

    cy.wait(2000);
    cy.get(".panel-helper .panel-header")
      .get(".panel-header-closing-row")
      .should("contain.text", "Cockpit");

    cy.get(".panel-header-closing-row").get(".ri-close-line").click();
  });

  it("Check that we can siwtch between 'Données brut' and 'Graphiques' mode ", () => {
    cy.get(".switch-tab").get(".brut").click().should("have.class", "selected");

    cy.get(".switch-tab")
      .get(".analytique")
      .click()
      .should("have.class", "selected");
  });

  it("Check that the default period is 12 months (until last month available for data)", () => {
    cy.get(".switch-tab").get(".brut").click();

    getLastMonthApi().then((response) => {
      expect(response.status).to.eq(200);

      const lastMonth = response.body.data.date;

      const endDate = new Date(lastMonth);
      const startDate = new Date(endDate);
      startDate.setMonth(endDate.getMonth() - 11);

      cy.get(".dates-selector")
        .find("aj-date-select")
        .first()
        .should("contain.text", getShortMonthString(startDate))
        .should("contain.text", startDate.getFullYear());

      cy.get(".dates-selector")
        .find("aj-date-select")
        .eq(1)
        .should("contain.text", getShortMonthString(endDate))
        .should("contain.text", endDate.getFullYear());
    });
  });

  it("Check that in the 'Données brutes' mode, the 'Temps moyen ... / dossier observé' change according to the selected agent category", () => {
    cy.get(".switch-tab").get(".brut").click();

    cy.get(".categories-switch")
      .get(".magistrats")
      .click()
      .then(() => {
        cy.get(".contentieux-header-calculator").within(() => {
          cy.get(".item")
            .last()
            .should("contain.text", "Temps moyen siège/ dossier observé");
        });
      });

    cy.get(".categories-switch")
      .get(".fonctionnaires")
      .click()
      .then(() => {
        cy.get(".contentieux-header-calculator").within(() => {
          cy.get(".item")
            .last()
            .should("contain.text", "Temps moyen greffe/ dossier observé");
        });
      });
  });

  it("Check that in the 'Graphiques' mode, the 'Temps moyen ... / dossier observé' change according to the selected agent category", () => {
    cy.get(".switch-tab").get(".analytique").click();

    cy.get(".categories-switch")
      .get(".magistrats")
      .click()
      .then(() => {
        cy.get(".container-colum")
          .last()
          .within(() => {
            cy.get(".title-section").should(
              "contain.text",
              "Temps moyen Siège"
            );
          });
      });

    cy.get(".categories-switch")
      .get(".fonctionnaires")
      .click()
      .then(() => {
        cy.get(".container-colum")
          .last()
          .within(() => {
            cy.get(".title-section").should(
              "contain.text",
              "Temps moyen Greffe"
            );
          });
      });
  });

  it("Check that the background color of the selected ETPT category (siege/geffe) change according to the selected agent category", () => {
    cy.get(".switch-tab").get(".brut").click();

    cy.get(".categories-switch")
      .get(".magistrats")
      .click()
      .then(() => {
        cy.get(".contentieux-header-calculator").within(() => {
          cy.get(".item")
            .eq(5)
            .should("have.css", "background-color", "rgb(227, 227, 253)");
        });
      });

    cy.get(".categories-switch")
      .get(".fonctionnaires")
      .click()
      .then(() => {
        cy.get(".contentieux-header-calculator").within(() => {
          cy.get(".item")
            .eq(6)
            .should("have.css", "background-color", "rgb(254, 231, 252)");
        });
      });
  });

  it("Check that on 'Graphiques' mode, the 'Voir les détails' & 'Masquer les détails' buttons work", () => {
    cy.get(".switch-tab").get(".analytique").click();
    cy.wait(2000);

    cy.get(".scroll-container")
      .children()
      .each(($el) => {
        const $button = Cypress.$($el).find(".details");

        cy.log("Button length:", $button.length);
        if ($button.length) {
          cy.wrap($button)
            .should("have.class", "no-print")
            .should("contain.text", "Voir les détails");

          cy.wrap($button).click();

          cy.wrap($button).should("contain.text", "Masquer les détails");
        }
      });
  });

  it("Comparator | Check that the selector displays year N-1 by default", () => {
    // Get the latest available month
    getLastMonthApi().then((response) => {
      expect(response.status).to.eq(200);

      const lastMonth = response.body.data.date;

      cy.log("Last month:", lastMonth);
      const endDate = new Date(lastMonth);
      endDate.setFullYear(endDate.getFullYear() - 1);

      const startDate = new Date(endDate);
      startDate.setMonth(endDate.getMonth() - 11);

      cy.get(".actions").within(() => {
        cy.get("button").first().click();
      });
      cy.get(".drop-down")
        .should("be.visible")
        .should(
          "contain.text",
          `${
            getShortMonthString(startDate) + ` ${startDate.getFullYear()}`
          } - ${getShortMonthString(endDate) + ` ${endDate.getFullYear()}`}`
        );
    });

    cy.get("body").click(0, 0);
  });

  it("Comparateur | Check that I can create a custom comparison period and that it appears in the selector as selected", () => {
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - 5);
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() - 1);

    cy.get(".actions").within(() => {
      cy.get("button").first().click();
    });

    cy.get(".drop-down")
      .should("be.visible")
      .get(".footer")
      .should("contain.text", "Personnaliser")
      .click();

    cy.get("aj-popup").within(() => {
      cy.get(".content .picker .first-section .action aj-date-select")
        .first()
        .click();
    });

    cy.get(".mat-datepicker-content")
      .should("be.visible")
      .get('button[aria-label="Choose date"]')
      .click()
      .get('button[aria-label="Choose month and year"]')
      .click()
      .get(".mat-calendar-body-cell-content")
      .contains(startDate.getFullYear())
      .click()
      .get(".mat-calendar-body-cell-content")
      .contains(getShortMonthString(startDate).toUpperCase())
      .click();

    cy.get("aj-popup").within(() => {
      cy.get(".content .picker .first-section .action aj-date-select")
        .eq(1)
        .click();
    });

    cy.get(".mat-datepicker-content")
      .should("be.visible")
      .get('button[aria-label="Choose date"]')
      .click()
      .get('button[aria-label="Choose month and year"]')
      .click()
      .get(".mat-calendar-body-cell-content")
      .contains(endDate.getFullYear())
      .click()
      .get(".mat-calendar-body-cell-content")
      .contains(getShortMonthString(endDate).toUpperCase())
      .click();

    cy.get("aj-popup").within(() => {
      cy.get(".save").click();
    });

    cy.wait(4000);

    cy.get(".actions").within(() => {
      cy.get("button").first().click();
    });
    cy.get(".drop-down")
      .should("be.visible")
      .contains(
        `${getShortMonthString(startDate) + ` ${startDate.getFullYear()}`} - ${
          getShortMonthString(endDate) + ` ${endDate.getFullYear()}`
        }`
      )
      .parent(".item")
      .within(() => {
        cy.get(".radio").should("have.class", "filled");
      });

    cy.get("body").click(0, 0);
  });

  it("Comparateur | Check that I can create a custom comparison referentiel", () => {
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - 5);
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() - 1);

    cy.get(".actions").within(() => {
      cy.get("button").first().click();
    });

    cy.get(".drop-down").should("be.visible");
    cy.get(".footer").should("contain.text", "Personnaliser").click();

    cy.get("aj-popup").within(() => {
      cy.contains("button", "Créer un référentiel").click();
    });

    cy.location("pathname").should("eq", "/temps-moyens");

    cy.get("aj-popup").within(() => {
      cy.get("textarea").type("Test comparateur referentiel");

      cy.get(".container");
      cy.get(".left").should("contain.text", "Siège");
      cy.get(".right").should("contain.text", "Greffe");

      cy.get(".actions .save").should("contain.text", "Enregistrer").click();
    });

    cy.location("pathname").should("include", "/referentiel-de-temps");

    const timeInputs = [
      { index: 0, time: "08:30" },
      { index: 4, time: "04:10" },
    ];

    timeInputs.forEach(({ index, time }) => {
      cy.get(".content-list .item-grouped")
        .eq(index)
        .within(() => {
          cy.get(".column-item")
            .first()
            .within(() => {
              cy.get(".label").first();
              cy.get("app-time-selector input").clear().type(time);
            });
        });
      cy.get("body").click(0, 0);
    });

    cy.get("aj-options-backup-panel").contains("button", "Enregistrer").click();

    cy.get("aj-popup").within(() => {
      cy.get(".content").should(
        "contain.text",
        "Votre référentiel est bien enregistré !"
      );
      cy.contains("button", "Poursuivre").click();
    });

    cy.location("pathname").should("eq", "/cockpit");

    cy.get("aj-popup").within(() => {
      cy.get(".ref-list")
        .contains("label", "Test comparateur referentiel")
        .click();
      cy.get(".actions .save").click();
    });

    cy.wait(2000);

    cy.get(".filters-item").contains("label", "Test comparateur referentiel");

    cy.get(".actions").within(() => {
      cy.get("button").first().click();
    });

    cy.get(".drop-down").should("be.visible").contains("Test comparateur");
    // .parent('.item')
    // .within(() => {
    //   cy.get('.radio').should('have.class', 'filled')
    // })
  });
});
