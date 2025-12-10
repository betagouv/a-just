import userContentieux from "../../fixtures/user-contentieux.json";
import {
  loginApi,
  getUserDataApi,
  resetToDefaultPermissions,
} from "../../support/api";

/**
 * E2E Tests for contentieux-based access rights
 * 
 * Test user: utilisateurcontentieux@a-just.fr
 * - Has access to all contentieux EXCEPT "Juges des Enfants"
 * 
 * Test agents:
 * - Agent A (TEST_AGENT_A): No ventilation
 * - Agent B (TEST_AGENT_B): Ventilation in "Juges des Enfants" (10%) + "Contentieux de la Protection" (10%)
 * - Agent C (TEST_AGENT_C): Ventilation ONLY in "Juges des Enfants" (10%)
 * 
 * Expected behavior on ventilateur page:
 * - Agent A should be VISIBLE (no ventilation = visible to all)
 * - Agent B should be VISIBLE (has ventilation in "Contentieux de la Protection" which user can access)
 * - Agent C should be HIDDEN (only has ventilation in "Juges des Enfants" which user cannot access)
 */
describe("Droits par contentieux - Ventilateur", () => {
  let userId;
  let token;
  let ventilations = [];

  before(() => {
    // Login with contentieux-restricted user and reset permissions
    return loginApi(userContentieux.email, userContentieux.password).then((resp) => {
      userId = resp.body.user.id;
      token = resp.body.token;

      return getUserDataApi(token).then((resp) => {
        ventilations = resp.body.data.backups.map((v) => v.id);
        // Reset to default permissions (all tools, restricted contentieux)
        return resetToDefaultPermissions(userId, ventilations, token).then(() => {
          // Now perform UI login
          cy.visit('/logout');
          cy.wait(1000);
          cy.visit('/connexion');
          cy.get('input[formcontrolname="email"]').type(userContentieux.email);
          cy.get('input[formcontrolname="password"]').type(userContentieux.password);
          cy.get('input[type="submit"]').click();
          cy.wait(2000);
        });
      });
    });
  });

  afterEach(() => {
    // Always restore default permissions after each test
    resetToDefaultPermissions(userId, ventilations, token);
  });

  it("Agent A (no ventilation) should be visible on ventilateur", () => {
    cy.visit("/ventilations");
    cy.wait(2000);
    cy.url().should("include", "/ventilations");

    // Agent A should be visible (no ventilation means visible to all users)
    cy.get(".sub-content-list person-preview").should("exist");
    cy.contains("A_NoVentilation").should("exist");
  });

  it("Agent B (ventilation in 2 contentieux including one accessible) should be visible on ventilateur", () => {
    cy.visit("/ventilations");
    cy.wait(2000);
    cy.url().should("include", "/ventilations");

    // Agent B should be visible (has ventilation in "Contentieux de la Protection" which user can access)
    cy.contains("B_TwoContentieux").should("exist");
  });

  it("Agent C (ventilation only in restricted contentieux) should NOT be visible on ventilateur", () => {
    cy.visit("/ventilations");
    cy.wait(2000);
    cy.url().should("include", "/ventilations");

    // Agent C should NOT be visible (only has ventilation in "Juges des Enfants" which user cannot access)
    cy.contains("C_OnlyJugesEnfants").should("not.exist");
  });

  it("All three agents: verify visibility rules together", () => {
    cy.visit("/ventilations");
    cy.wait(2000);
    cy.url().should("include", "/ventilations");

    // Get all person previews
    cy.get(".sub-content-list person-preview").then(($agents) => {
      const agentTexts = $agents.toArray().map(el => el.textContent);
      const allText = agentTexts.join(" ");

      // Agent A should be visible
      expect(allText).to.include("A_NoVentilation");

      // Agent B should be visible
      expect(allText).to.include("B_TwoContentieux");

      // Agent C should NOT be visible
      expect(allText).to.not.include("C_OnlyJugesEnfants");
    });
  });
});
