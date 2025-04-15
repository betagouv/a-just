import user from '../../fixtures/user.json'

describe('Forgot Password Page', () => {

    // beforeEach(() => {
    //     cy.visit(`/mot-de-passe-oublie`)
    // })
    let token = null

    it("should verify existence of forgotten password button and its navigation", () => {
        cy.clearAllLocalStorage()
        cy.visit(`/connexion`)
        cy.get('form > .remember-row > a')
            .should('contain.text', 'Mot de passe oublié')
            .click()
        cy.location('pathname')
            .should('eq', '/mot-de-passe-oublie')
    })

    it('should open popup after entering email and clicking reset button, then return to login page after closing popup', () => {
       
        cy.visit(`/mot-de-passe-oublie`)

        cy.intercept({
            method: 'POST',
            url: '/api/users/forgot-password-test'
        }).as('forgotPasswordToken')

        // Entering email and clicking reset button        
        cy.get('form')
            .get("input[type=email]").type(user.email)
            .get("input[type=submit]").click()

        cy.wait('@forgotPasswordToken').then((interception) => {
            token = interception.response.body.data.code
            cy.log('TOKEN:', interception.response.body.data.code)
        })

        // Verifying popup contains email
        cy.get('aj-popup')
            .should('contain.text', user.email)

        //Closing popup and verifying redirection to login page
        cy.get('.close').click()
            .location('pathname')
            .should('eq', '/connexion')
    })

    it('Check if user can reset password with valid email', () => {

        cy.visit('/nouveau-mot-de-passe')

        cy.log('token:', token)
        // Entering email and clicking reset button
        cy.get('form')
            .get("input[type=email]").type(user.email)
            .get("input[type=text]").type(token)
            .get(".first-password").type(user.password)
            .get(".confirm-password").type(user.password)
            .get("input[type=submit]").click()

    
        cy.on("window:alert", (alert) => {
            expect(alert).to.equal("Votre mot de passe est maintenant changé. Vous pouvez dès maintenant vous connecter.")
            }
        )
        cy.location('pathname')
            .should('eq', '/connexion')

    })
})