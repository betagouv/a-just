describe("Ventilateur", () => {
  before(() => {
    cy.login();
  });
  beforeEach(() => {
    cy.visit("/ventilations");
  });

  // Vérification que la page du ventilateur se charge correctement
  it("Check the ventilateur page load", () => {
    cy.visit("/ventilations");
    cy.wait(1000);
    cy.url().should("include", "/ventilations");
  });

  it('Check that the button on top "Simuler des affectations" is there and when clicked, redirect to the right page ', () => {
    cy.get(".header")
      .get(".top-header")
      .get(".actions")
      .find("a")
      .find("button")
      .should("contain.text", "Simuler des affectations")
      .click()
      .location("pathname")
      .should("contain", "/reaffectateur");
    cy.go("back");
  });

  it('Check that the button on top "Ajouter un agent" is there and when clicked, opens the right pag ', () => {
    cy.get(".header")
      .get(".top-header")
      .get(".actions")
      .find("button")
      .get(".add-collaborator")
      .should("contain.text", "Ajouter un agent")
      .click();

    cy.wait(10000);

    cy.url().should("include", "/resource-humaine");
    cy.go("back");
  });

  it("Check that when an agent’s card is clicked, it redirects to the full agent’s profile", () => {
    let userId = 0;

    cy.get(".sub-content-list person-preview:first")
      .invoke("attr", "id")
      .then((id) => {
        userId = id.split("-")[1];
        cy.get(".sub-content-list person-preview:first").within(() => {
          cy.get(".actions a").click();
          cy.wait(1000);
          cy.location("pathname").should(
            "include",
            `/resource-humaine/${userId}`
          );
          cy.go("back");
        });
      });
  });

  it('All categories ("Siege", "Greffe" and "Autour du magistrat") must be activated by default', () => {
    //Siege
    cy.get(".radio-border-left")
      .first()
      .find("aj-radio-button")
      .should("have.class", "selected");

    //Greffe
    cy.get(".radio-border-left")
      .eq(1)
      .find("aj-radio-button")
      .should("have.class", "selected");

    //Autour du magistrat
    cy.get(".radio-border-left")
      .eq(2)
      .find("aj-radio-button")
      .should("have.class", "selected");
  });
});
