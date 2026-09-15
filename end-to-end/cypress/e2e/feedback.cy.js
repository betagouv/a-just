import { ensureE2EUserReady } from "../../support/api";

describe("Feedback", () => {
    before(() => {
        // "Ceinture": cy.login() réapplique les droits par défaut avant le login UI
        cy.login();
    });

    after(() => {
        // "Bretelles": Always restore default permissions after tests
        ensureE2EUserReady();
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