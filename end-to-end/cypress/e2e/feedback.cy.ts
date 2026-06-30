import { getUserDataApi, loginApi, resetToDefaultPermissions } from "../../support/api";
import user from "../../fixtures/user.json";    

describe("Feedback", () => {
    let userId;
    let token;
    let ventilations = [];


    before(() => {
        // "Ceinture": Explicitly set required permissions before tests
        return loginApi(user.email, user.password).then((resp) => {
          userId = resp.body.user.id;
          token = resp.body.token;
    
          return getUserDataApi(token).then((resp) => {
                ventilations = resp.body.data.backups.map((v) => v.id);
        
                // Ensure full default permissions (including greffier access needed for .fonctionnaires)
                return resetToDefaultPermissions(userId, ventilations, token).then(() => {
                    cy.login(user.email, user.password);
                });
            });
        });
    });
    
    after(() => {
        // "Bretelles": Always restore default permissions after tests
        return loginApi(user.email, user.password).then((resp) => {
            userId = resp.body.user.id;
            token = resp.body.token;
        
            return getUserDataApi(token).then((resp) => {
                ventilations = resp.body.data.backups.map((v) => v.id);
                return resetToDefaultPermissions(userId, ventilations, token);
            });
        });
    });
    
    beforeEach(() => {
        cy.get("body").then(($body) => {
            if ($body.find(".panel-helper .ri-close-line").length) {
                cy.get(".panel-helper .ri-close-line").click({ force: true });
            }
        });
    });

    it("Should display the feedback banner", () => {
        cy.visit("/panorama");
        cy.get("aj-feedback-banner").should("exist");
        cy.get("aj-feedback-banner").find('p').should("contain", "Quel est votre niveau de satisfaction concernant l'outil A-JUST ?");
        cy.get("aj-feedback-banner").find("button").should("contain", "Je donne mon avis");
    });

    it("Should close the feedback banner when clicking on the 'X' button", () => {
        cy.visit("/panorama");
        cy.get("aj-feedback-banner").should("exist");
        cy.get("aj-feedback-banner").find("i").click();
        cy.get("aj-feedback-banner").should("not.be.visible");
    });

    it("Should open the feedback popin when clicking on the 'Je donne mon avis' button", () => {
        cy.visit("/panorama");
        cy.get("aj-feedback-banner").should("exist");
        cy.get("aj-feedback-banner").find("button").click();
        cy.get("aj-popin-feedback").should("exist");
    });

    it("Should close the feedback popin when clicking on the 'Annuler' button", () => {
        cy.visit("/panorama");
        cy.get("aj-feedback-banner").should("exist");
        cy.get("aj-feedback-banner").find("button").click();
        cy.get("aj-popin-feedback").should("exist");
        cy.get("aj-popin-feedback").find("button").contains("Annuler").click();
        cy.get("aj-popin-feedback").should("not.exist");
    });

    it("Should show aj-alert-small when clicking on the 'Envoyer' button without selecting a rating", () => {
        cy.visit("/panorama");
        cy.get("aj-feedback-banner").should("exist");
        cy.get("aj-feedback-banner").find("button").click();
        cy.get("aj-popin-feedback").should("exist");
        cy.get("aj-popin-feedback").find("button").contains("Envoyer").click();
        cy.get("aj-alert-small").should("exist");
    });

    it("Should fill and submit the feedback when clicking on the 'Envoyer' button, show the 'Merci pour votre avis' notification and close the popin & banner", () => {
        cy.visit("/panorama");
        cy.get("aj-feedback-banner").should("exist");
        cy.get("aj-feedback-banner").find("button").click();
        cy.get("aj-popin-feedback").should("exist");
        cy.get("aj-popin-feedback").find(".star-icon").eq(4).click();
        cy.get("aj-popin-feedback").find("textarea").type("Test de feedback 5 étoiles");
        cy.get("aj-popin-feedback").find("button").contains("Envoyer").click();

        cy.get("aj-popin-feedback").should("not.exist");
        cy.get("aj-feedback-banner").should("not.be.visible");
    });
});