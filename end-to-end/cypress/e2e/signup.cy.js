const selectFirstFunction = () => {
  cy.get("input#fonction-select").click();
  cy.get(".aj-autocomplete-panel .juridiction-item").first().click();
};

describe("Signup Page", () => {
  before(() => {
    // Clear all session state to ensure clean test environment
    cy.clearCookies();
    cy.clearAllLocalStorage();

    // Intercept API calls to ensure they complete before proceeding
    cy.intercept('GET', '**/api/users/interface-type').as('interfaceType');
    cy.intercept('GET', '**/api/users/me').as('userMe');

    cy.visit(`/connexion`);

    // Wait for API calls to complete
    cy.wait(['@interfaceType', '@userMe'], { timeout: 15000 });

    // Now find the signup element with increased timeout
    cy.get(".signup", { timeout: 10000 })
      .should("contain.text", "Rejoindre A-JUST")
      .get("a > button")
      .should("contain.text", "Demander votre embarquement")
      .click();
    cy.location("pathname").should("eq", "/inscription");
  });

  // it('Check "Embarquer avec Pages Blanches" button exists and can be clicked', () => {
  //   cy.get('#signupSSO')
  //     .should('contain.text', 'Embarquer avec Pages Blanches')
  // })

  it("Keeps continue disabled for a non-professional email", () => {
    selectFirstFunction();
    cy.get('input[formControlName="firstName"]').type("UserTestFirstname");
    cy.get('input[formControlName="lastName"]').type("UserTestLastname");
    cy.get('input[formControlName="email"]').type("userTest@test.mail.fr");
    cy.get('input[formControlName="password"]').type("1xDrv9&!");
    cy.get('input[formControlName="passwordConf"]').type("1xDrv9&!");
    cy.get('input[formControlName="checkbox"]').check();
    cy.get(".next-step").should("be.disabled");
    cy.visit(`/inscription`);
  });

  it("Keeps continue disabled if gouv.fr is only in the local part of the email", () => {
    selectFirstFunction();
    cy.get('input[formControlName="firstName"]').type("UserTestFirstname");
    cy.get('input[formControlName="lastName"]').type("UserTestLastname");
    cy.get('input[formControlName="email"]').type("test.gouv.fr@attacker-controlled-domain.example");
    cy.get('input[formControlName="password"]').type("1xDrv9&!");
    cy.get('input[formControlName="passwordConf"]').type("1xDrv9&!");
    cy.get('input[formControlName="checkbox"]').check();
    cy.get(".next-step").should("be.disabled");
    cy.visit(`/inscription`);
  });

  it("Keeps continue disabled if the password is not strong enough", () => {
    selectFirstFunction();
    cy.get('input[formControlName="firstName"]').type("UserTestFirstname");
    cy.get('input[formControlName="lastName"]').type("UserTestLastname");
    cy.get('input[formControlName="email"]').type("userTest@justice.gouv.fr");
    cy.get('input[formControlName="password"]').type("easyPassword!");
    cy.get('input[formControlName="passwordConf"]').type("easyPassword");
    cy.get('input[formControlName="checkbox"]').check();
    cy.get(".next-step").should("be.disabled");
    cy.visit(`/inscription`);
  });

  it("Check that we can fill the form to signup ", () => {
    cy.get(".next-step").should("be.disabled");
    cy.get('input[formControlName="firstName"]').type("UserTestFirstname");
    cy.get('input[formControlName="lastName"]').type("UserTestLastname");
    cy.get('input[formControlName="email"]').type("userTest@justice.gouv.fr");
    cy.get('input[formControlName="password"]').type("1xDrv9&!");
    cy.get('input[formControlName="passwordConf"]').type("1xDrv9&!");
    selectFirstFunction();
    cy.get(".next-step").should("be.disabled");
    cy.get('input[formControlName="checkbox"]').check();

    cy.get(".next-step").should("be.enabled").click();
    cy.get('label[for="rattach-select"]').should("be.visible");
    cy.get("input[type=submit]").should("be.disabled");
    cy.get("input#rattach-select").should("be.visible").click();
    cy.get(".aj-autocomplete-panel .juridiction-item")
      .not(".disabled")
      .first()
      .click();
    cy.get("input[type=submit]").should("be.enabled").click();
    cy.location("pathname").should("eq", "/bienvenue");
  });
});
