import user from '../fixtures/user.json'

describe('Login Page', () => {

    beforeEach(() => {
        cy.visit(`/connexion`)
    })

    it('should verify existence of Page Blanche button', () => {
        cy.get('form')
            .should('contain.text', 'Vous avez déjà un compte')
            .get('button')
            .should('contain.text', 'Se connecter avec Pages Blanches')
    })

    it('should verify login functionality with username and password and button can be clicked', () => {
        cy.get('form')
            .should('contain.text', 'Vous avez déjà un compte')
            .get('h3')
            .should('contain.text', 'Se connecter avec son compte')
            .get('input[type=email]').type(user.email)
            .get('input[type=password]').type(user.password)
            .get('input[type=submit]').click()
    })



})
