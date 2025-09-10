import user from "../../fixtures/user.json";

describe("Forgot Password Page", () => {
  // beforeEach(() => {
  //     cy.visit(`/mot-de-passe-oublie`)
  // })
  let token = null;

  it("should verify existence of forgotten password button and its navigation", () => {
    cy.clearAllLocalStorage();
    cy.visit(`/connexion`);
    cy.get("form > .remember-row > a")
      .should("contain.text", "Mot de passe oublié")
      .click();
    cy.location("pathname").should("eq", "/mot-de-passe-oublie");
  });

  it("Check that an alert is raised if the email is unknown (before the email is sent)", () => {
    cy.visit(`/mot-de-passe-oublie`);

    cy.window().then((win) => {
      cy.stub(win, "alert").as("alert");
    });

    // Entering email and clicking reset button
    cy.get("form")
      .get("input[type=email]")
      .type("qdtpa" + user.email)
      .get("input[type=submit]")
      .click();

    cy.get("@alert").should(
      "have.been.calledWith",
      "Information de contact non valide!"
    );
  });

  it("should open popup after entering correct email and clicking reset button, then return to login page after closing popup", () => {
    cy.visit(`/mot-de-passe-oublie`);

    cy.intercept({
      method: "POST",
      url: "/api/users/forgot-password-test",
    }).as("forgotPasswordToken");

    // Entering email and clicking reset button
    cy.get("form")
      .get("input[type=email]")
      .type(user.email)
      .get("input[type=submit]")
      .click();

    cy.wait("@forgotPasswordToken").then((interception) => {
      token = interception.response.body.data.code;
    });

    // Verifying popup contains email
    cy.get("aj-popup").should("contain.text", user.email);

    //Closing popup and verifying redirection to login page
    cy.get(".close").click().location("pathname").should("eq", "/connexion");
  });

  it("check that an alert is raised if the email is not registered", () => {
    cy.visit("/nouveau-mot-de-passe");

    cy.window().then((win) => {
      cy.stub(win, "alert").as("alert");
    });

    cy.get("form")
      .get("input[type=email]")
      .type("qsdqqsdfgi" + user.email)
      .get("input[type=text]")
      .type(token)
      .get(".first-password")
      .type(user.password)
      .get(".confirm-password")
      .type(user.password)
      .get("input[type=submit]")
      .click();

    cy.get("@alert").should(
      "have.been.calledWith",
      "Information de contact ou code de vérification non valide!"
    );
  });

  it("check that an alert is raised if the password and confirmation password are differents", () => {
    cy.visit("/nouveau-mot-de-passe");

    cy.window().then((win) => {
      cy.stub(win, "alert").as("alert");
    });

    cy.get("form")
      .get("input[type=email]")
      .type(user.email)
      .get("input[type=text]")
      .type(token)
      .get(".first-password")
      .type(user.password)
      .get(".confirm-password")
      .type(user.password + "123")
      .get("input[type=submit]")
      .click();

    cy.get("@alert").should(
      "have.been.calledWith",
      "Vos mots de passe ne sont pas identiques"
    );
  });

  it("check that an alert is raised if the password is too short", () => {
    cy.visit("/nouveau-mot-de-passe");

    cy.window().then((win) => {
      cy.stub(win, "alert").as("alert");
    });

    cy.get("form")
      .get("input[type=email]")
      .type(user.email)
      .get("input[type=text]")
      .type(token)
      .get(".first-password")
      .type("Xjq3av!")
      .get(".confirm-password")
      .type("Xjq3av!")
      .get("input[type=submit]")
      .click();

    cy.get("@alert").should(
      "have.been.calledWith",
      "Vous devez saisir un mot de passe qui remplit les critères obligatoires"
    );
  });

  it("Check that an alert is raised if the password does not contain at least one special character", () => {
    cy.visit("/nouveau-mot-de-passe");

    cy.window().then((win) => {
      cy.stub(win, "alert").as("alert");
    });

    cy.get("form")
      .get("input[type=email]")
      .type(user.email)
      .get("input[type=text]")
      .type(token)
      .get(".first-password")
      .type("Xjq3aGvp")
      .get(".confirm-password")
      .type("Xjq3aGvp")
      .get("input[type=submit]")
      .click();

    cy.get("@alert").should(
      "have.been.calledWith",
      "Vous devez saisir un mot de passe qui remplit les critères obligatoires"
    );
  });

  it("Check that an alert is raised if the password does not contain at least one number", () => {
    cy.visit("/nouveau-mot-de-passe");

    cy.window().then((win) => {
      cy.stub(win, "alert").as("alert");
    });

    cy.get("form")
      .get("input[type=email]")
      .type(user.email)
      .get("input[type=text]")
      .type(token)
      .get(".first-password")
      .type("Xjq!aGvp")
      .get(".confirm-password")
      .type("Xjq!aGvp")
      .get("input[type=submit]")
      .click();

    cy.get("@alert").should(
      "have.been.calledWith",
      "Vous devez saisir un mot de passe qui remplit les critères obligatoires"
    );
  });

  it("Check that an alert is raised if the password does not contain at least one uppercase character", () => {
    cy.visit("/nouveau-mot-de-passe");

    cy.window().then((win) => {
      cy.stub(win, "alert").as("alert");
    });

    cy.get("form")
      .get("input[type=email]")
      .type(user.email)
      .get("input[type=text]")
      .type(token)
      .get(".first-password")
      .type("xjq31av!")
      .get(".confirm-password")
      .type("xjq31av!")
      .get("input[type=submit]")
      .click();

    cy.get("@alert").should(
      "have.been.calledWith",
      "Vous devez saisir un mot de passe qui remplit les critères obligatoires"
    );
  });

  it("Check if user can reset password with valid email", () => {
    cy.visit("/nouveau-mot-de-passe");

    // Entering email and clicking reset button
    cy.get("form")
      .get("input[type=email]")
      .type(user.email)
      .get("input[type=text]")
      .type(token)
      .get(".first-password")
      .type(user.password)
      .get(".confirm-password")
      .type(user.password)
      .get("input[type=submit]")
      .click();

    cy.on("window:alert", (alert) => {
      expect(alert).to.equal(
        "Votre mot de passe est maintenant changé. Vous pouvez dès maintenant vous connecter."
      );
    });
    cy.location("pathname").should("eq", "/connexion");
  });
});
