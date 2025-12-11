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

  it("Check that we have an error if email is different from @justice.gouv.fr or @*.gouv.fr", () => {
    cy.get('input[formControlName="firstName"]').type("UserTestFirstname");
    cy.get('input[formControlName="lastName"]').type("UserTestLastname");
    cy.get('input[formControlName="email"]').type("userTest@test.mail.fr");
    cy.get('input[formControlName="password"]').type("1xDrv9&!");
    cy.get('input[formControlName="passwordConf"]').type("1xDrv9&!");
    cy.get('input[formControlName="checkbox"]').check();

    cy.on("window:alert", (alert) => {
      expect(alert).to.equal(
        "Vous devez saisir une adresse e-mail professionnelle"
      );
    });
    cy.visit(`/inscription`);
  });

  it("Check that we have an error if password is not strong enough", () => {
    cy.get('input[formControlName="firstName"]').type("UserTestFirstname");
    cy.get('input[formControlName="lastName"]').type("UserTestLastname");
    cy.get('input[formControlName="email"]').type("userTest@justice.gouv.fr");
    cy.get('input[formControlName="password"]').type("easyPassword!");
    cy.get('input[formControlName="passwordConf"]').type("easyPassword");
    cy.get('input[formControlName="checkbox"]').check();
    cy.get(".next-step").click();

    cy.on("window:alert", (alert) => {
      expect(alert).to.equal(
        "Vous devez saisir un mot de passe qui remplit les critères obligatoires"
      );
    });
    cy.visit(`/inscription`);
  });

  it("Check that we can fill the form to signup ", () => {
    cy.get('input[formControlName="firstName"]').type("UserTestFirstname");
    cy.get('input[formControlName="lastName"]').type("UserTestLastname");
    cy.get('input[formControlName="email"]').type("userTest@justice.gouv.fr");
    cy.get('input[formControlName="password"]').type("1xDrv9&!");
    cy.get('input[formControlName="passwordConf"]').type("1xDrv9&!");
    cy.get('input[formControlName="checkbox"]').check();

    cy.get(".next-step").click();
    cy.contains("label", "Mon tribunal de rattachement :").should("be.visible");
    cy.get("select").first().select(1);
    cy.contains("label", "Ma fonction :").should("be.visible");
    cy.get("select").eq(1).select(1);
    cy.get("input[type=submit]").click();
    cy.location("pathname").should("eq", "/bienvenue");
  });
});
