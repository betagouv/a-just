import user from "../../fixtures/user.json";

describe("Login Page", () => {
  beforeEach(() => {
    cy.clearAllLocalStorage();
    cy.visit(`/connexion`);
  });

  it("Check the login page load", () => {
    cy.visit(`/connexion`);
    cy.wait(1000);
    cy.url().should("include", "/connexion");
  });

  it("should verify existence of Page Blanche button", () => {
    const ssoIsActivate = Cypress.env("NG_APP_ENABLE_SSO");
    if (ssoIsActivate) {
      cy.get("form")
        .should("contain.text", "Vous avez déjà un compte")
        .get(".sso-bt")
        .should("contain.text", "Se connecter avec Pages Blanches");
    }
  });

  it("Try to connect with an invalid email", () => {
    cy.get("form")
      .should("contain.text", "Vous avez déjà un compte")
      .get("h3")
      .should("contain.text", "Se connecter avec son compte")
      .get("input[type=email]")
      .type("invalideemail@mail.com")
      .get("input[type=password]")
      .type(user.password)
      .get("form")
      .submit();
    cy.on("window:alert", (alert) => {
      expect(alert).to.equal("Email ou mot de passe incorrect");
    });
    cy.get(".error-message").should(
      "contain.text",
      "Email ou mot de passe incorrect"
    );
  });

  it("Try to connect with an invalid password", () => {
    cy.get("form")
      .should("contain.text", "Vous avez déjà un compte")
      .get("h3")
      .should("contain.text", "Se connecter avec son compte")
      .get("input[type=email]")
      .type(user.email)
      .get("input[type=password]")
      .type("invalidpassword!8")
      .get("form")
      .submit();
    cy.on("window:alert", (alert) => {
      expect(alert).to.equal("Email ou mot de passe incorrect");
    });
    cy.get(".error-message").should(
      "contain.text",
      "Email ou mot de passe incorrect"
    );
  });

  it("Check login functionality with correct username and password", () => {
    cy.get("form")
      .should("contain.text", "Vous avez déjà un compte")
      .get("h3")
      .should("contain.text", "Se connecter avec son compte")
      .get("input[type=email]")
      .type(user.email)
      .get("input[type=password]")
      .type(user.password)
      .get("form")
      .submit();
    cy.location("pathname").should("include", "/panorama");
  });
});
