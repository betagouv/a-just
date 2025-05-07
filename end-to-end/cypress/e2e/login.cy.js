import user from '../../fixtures/user.json'

describe('Login Page', () => {

    beforeEach(() => {
      cy.clearAllLocalStorage()
      cy.visit(`/connexion`)
    })

    it('should verify existence of Page Blanche button', () => {
      cy.get('form')
        .should('contain.text', 'Vous avez déjà un compte')
        .get('button')
        .should('contain.text', 'Se connecter avec Pages Blanches')
    })

    it('Try to connect with an invalid email', () => {
      cy.get('form')
        .should('contain.text', 'Vous avez déjà un compte')
        .get('h3')
        .should('contain.text', 'Se connecter avec son compte')
        .get('input[type=email]').type('invalideemail@mail.com')
        .get('input[type=password]').type(user.password)
        .get('form').submit()
        cy.on("window:alert", (alert) => {
          expect(alert).to.equal("Email ou mot de passe incorrect")
          }
        )
        cy.get('.error-message').should('contain.text', 'Email ou mot de passe incorrect')
    })

    it('Try to connect with an invalid password', () => {
      cy.get('form')
        .should('contain.text', 'Vous avez déjà un compte')
        .get('h3')
        .should('contain.text', 'Se connecter avec son compte')
        .get('input[type=email]').type(user.email)
        .get('input[type=password]').type('invalidpassword!8')
        .get('form').submit()
        cy.on("window:alert", (alert) => {
          expect(alert).to.equal("Email ou mot de passe incorrect")
          }
        )
        cy.get('.error-message').should('contain.text', 'Email ou mot de passe incorrect')
    })

    it('should verify login functionality with username and password and button can be clicked', () => {
      cy.get('form')
        .should('contain.text', 'Vous avez déjà un compte')
        .get('h3')
        .should('contain.text', 'Se connecter avec son compte')
        .get('input[type=email]').type(user.email)
        .get('input[type=password]').type(user.password)
        .get('form').submit();
      cy.location('pathname')
        .should('include', '/panorama');
    })
})
