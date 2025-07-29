describe("Panorama page", () => {
  before(() => {
    cy.login();
  });

  it("Check reaffectator page load", () => {
    cy.visit("/reaffectateur");
    cy.wait(1000);
    cy.url().should("include", "/reaffectateur");
  });
});
