import user from "../../fixtures/user.json";
import { getUserDataApi, loginApi, resetToDefaultPermissions } from "../../support/api";

describe("Données d'activité", () => {
  let userId;
  let token;

  before(() => {
    // Ensure user has full permissions before UI login
    loginApi(user.email, user.password).then((resp) => {
      const userId = resp.body.user.id;
      const token = resp.body.token;

      return getUserDataApi(token).then((resp) => {
        const ventilations = resp.body.data.backups.map((v) => v.id);
        return resetToDefaultPermissions(userId, ventilations, token);
      });
    }).then(() => {
      // Now proceed with UI login
      cy.login();
    });
  });

  it("Should check that the data editing window can be opened", () => {
    cy.visit("/donnees-d-activite");

    let contentieuxName = "";

    cy.get(".item-grouped").get(".item .label p").first().invoke("text").then((text) => {
      const contentieuxName = text.replace(/\s+/g, " ").trim();

      cy.log(`Contentieux Name: ${contentieuxName}`);

      cy.get(".item .label p").first().click();

      cy.get(".group-item").first().click();

      cy.get(".title-popin div h2")
        .should("contain", contentieuxName);
    });
  });
});