import user from '../../fixtures/user.json'

describe('Signup Page', () => {

  beforeEach(() => {
    cy.clearAllLocalStorage();
    cy.visit(`/connexion`)
    cy.get('.signup')
      .should('contain.text', 'Rejoindre A-JUST')
      .get('a > button')
      .should('contain.text', 'Demander votre embarquement')
      .click()
    cy.location('pathname')
      .should('eq', '/inscription')
  })

  it('Check "Embarquer avec Pages Blanches" button exists and can be clicked', () => {
    cy.get('#signupSSO')
      .should('contain.text', 'Embarquer avec Pages Blanches')
  })

  it('Check that we can fill the form to signup ', () => {
      cy.get('input[formControlName="firstName"]').type("UserTestFirstname")
      cy.get('input[formControlName="lastName"]').type("UserTestLastname")
      cy.get('input[formControlName="email"]').type("userTest@justice.gouv.fr")
      cy.get('input[formControlName="password"]').type("1xDrv9&!")
      cy.get('input[formControlName="passwordConf"]').type("1xDrv9&!")
      cy.get('input[formControlName="checkbox"]').check();

      cy.get('.next-step').click()
      cy.contains('label', 'Mon tribunal de rattachement :').should('be.visible');
      cy.get('select').first().select(1);
      cy.contains('label', 'Ma fonction :').should('be.visible');
      cy.get('select').eq(1).select(1);
      cy.get('input[type=submit]').click()
  })  
})