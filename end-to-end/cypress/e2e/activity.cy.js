import { getShortMonthString } from "../../support/utils/dates";

describe("Données d'activité", () => {
  before(() => {
    cy.login();
  });

  it("Check the activity data page load", () => {
    cy.visit("/donnees-d-activite");
    cy.wait(1000);
    cy.url().should("include", "/donnees-d-activite");
  });

  it("Check the name page is displayed", () => {
    cy.get(".title-with-doc")
      .get("h3")
      .should("contain.text", "Données d'activité");
  });

  it("Check that the doc button is accessible", () => {
    cy.get(".top-header")
      .get(".top-header-back-title .title-with-doc")
      .get("aj-help-button")
      .click();

    cy.wait(1000);

    cy.get(".panel-helper .panel-header")
      .get(".panel-header-closing-row")
      .should("contain.text", "Données d'activité A-JUST :");
    cy.get(".panel-header-closing-row").get(".ri-close-line").click();
  });

  it("Check that we can change period", () => {
    const date = new Date();
    date.setMonth(date.getMonth() - 6);

    cy.get("aj-date-select")
      .should("be.visible")
      .click()
      .get('button[aria-label="Choose date"]')
      .click()
      .get('button[aria-label="Choose month and year"]')
      .click()
      .get(".mat-calendar-body-cell-content")
      .contains(date.getFullYear())
      .click()
      .get(".mat-calendar-body-cell-content")
      .contains(getShortMonthString(date).toUpperCase())
      .click()
      .get(".mat-calendar-body-cell-content")
      .contains(date.getDate())
      .click();
  });

  it("Check that the 'Complétude gloabe' progress bar is displayed", () => {
    cy.get(".actions .left-panel").get(".completion-bar").should("be.visible");
  });

  it("Check that ressources 'Nomenclature' and 'Data-book' are available", () => {
    cy.get(".actions .right-panel")
      .contains("Ressources")
      .should("be.visible")
      .get(".elements")
      .within(() => {
        cy.contains("La nomenclature");
        cy.contains("Le data-book");
      });
  });

  // it('Check that all contentieux (level 2 + 3) are displayed', () => {

  // })

  it("Check that all documentations are displayed and available", () => {
    // cy.get('.content-list .item-grouped').each(($group) => {
    //   const group = cy.wrap($group)
    //   group.find('.tooltip').then(($tooltip) => {
    //     if ($tooltip.is(':visible')) {
    //       cy.wrap($tooltip).should('be.visible').click({ force: true })
    //     } else {
    //       group.find('.item.selectable').click({ force: true })
    //       // Puis on attend qu’il soit visible
    //       group.find('.tooltip')
    //         .should('exist')
    //         .and('be.visible')
    //     }
    //   })
    // })
  });
});
