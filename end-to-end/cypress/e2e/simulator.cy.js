describe("Simulator page", () => {
  before(() => {
    cy.login();
  });

  // Vérification que la page du simulateur se charge correctement
  it("Check simulator page load", () => {
    cy.visit("/simulateur");
    cy.wait(10000);
    cy.url().should("include", "/simulateur");
  });

  // Vérification que la page du simulateur à blanc se charge correctement
  it("Check white simulator page load", () => {
    cy.visit("/simulateur-sans-donnees");
    cy.wait(10000);
    cy.url().should("include", "/simulateur-sans-donnees");
  });
});
