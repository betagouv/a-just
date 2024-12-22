import user from '../../fixtures/user.json'

describe('Forgot Password Page', () => {

    // beforeEach(() => {
    //     cy.visit(`/mot-de-passe-oublie`)
    // })

    it("should verify existence of forgotten password button and its navigation", () => {
        cy.visit(`/connexion`)
        cy.get('form > .remember-row > a')
            .should('contain.text', 'Mot de passe oublié')
            .click()
        cy.location('pathname')
            .should('eq', '/mot-de-passe-oublie')
    })

    it('should open popup after entering email and clicking reset button, then return to login page after closing popup', () => {
        cy.visit(`/mot-de-passe-oublie`)
        // Entering email and clicking reset button
        cy.get('form')
            .get("input[type=email]").type(user.email)
            .get("input[type=submit]").click()

        // Verifying popup contains email
        cy.get('aj-popup')
            .should('contain.text', user.email)

        //Closing popup and verifying redirection to login page
        cy.get('.close').click()
            .location('pathname')
            .should('eq', '/connexion')
    })
})