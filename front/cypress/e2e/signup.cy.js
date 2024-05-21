import user from '../fixtures/user.json'

describe('Signup Page', () => {

    beforeEach(() => cy.visit(`/inscription`))
    
    it('should verify existence of SignUp button and navigation to sign up page', () => {
        cy.visit(`/connexion`)
        cy.get('.signup')
            .should('contain.text', 'Rejoindre A-JUST')
            .get('a > button')
            .should('contain.text', 'Demander votre embarquement')
            .click()
        cy.location('pathname')
            .should('eq', '/inscription')
        cy.go('back')
    })

    it('Check "Embarquer avec Pages Blanches" button exists and can be clicked', () => {
        cy.get('form')
            .get('.sso-bt')
            .should('contain.text', ' Embarquer avec Pages Blanches')
    })

    it('Check that we can fill the form to signup ', () => {
        cy.get('form')
            .get('input[placeholder="Prénom"]').type(user.firstName)
        cy.get('form')
            .get('input[placeholder="Nom"]').type(user.lastName)
        cy.get('form')
            .get('input[type=email]').type(user.email)
        cy.get('form')
            .get('input[type=password]').first().type(user.password)
        cy.get('form')
            .get('input[type=password]').eq(1).type(user.password)
        cy.get('form')
            .get('.checkbox-container > input[type=checkbox]')
            .click()
        cy.get('form')
            .get('.next-step')
            .click()
        cy.get('select').first()
            .select(1)
        cy.get('select').eq(1)
            .select(1)
        // cy.get('input[type=submit]')
        //     .click()
    })  
})