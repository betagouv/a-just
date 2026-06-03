import user from "../../fixtures/user.json";
import { getUserDataApi, loginApi, resetToDefaultPermissions } from "../../support/api";

describe("Données d'activité", () => {
  let userId;
  let token;

  before(() => {
    //Login to get the admin user token so we can retrieve user data
    return loginApi(user.email, user.password).then((resp) => {
      userId = resp.body.user.id;
      token = resp.body.token;

      // Get user data to retrieve ventilations list
      return getUserDataApi(token).then((resp) => {
        // Explicitly reset permissions to ensure clean state (belt and suspenders)
        // This protects against database state issues or incomplete seeder execution
        return resetToDefaultPermissions(userId, ventilations, token);
      });
    });
  });

  // afterEach(() => {
  //   // "Bretelles": Always restore to full default permissions after each test
  //   // This ensures test isolation even if a test fails or modifies permissions
  //   // Rate limiting has been disabled in test config (maxQueryLimit: 10000000)
  //   resetToDefaultPermissions(userId, ventilations, token);
  // });

  it("Should check that the data editing window can be opened", () => {
    cy.visit("/donnees-activite");
  });
});