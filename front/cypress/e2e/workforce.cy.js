describe('Ventilateur', () => {

  beforeEach(() => {
    cy.login()
    cy.visit('/ventilations')
  })

  it('Check that the button on top "Simuler des affectations" is there and when clicked, redirect to the right page ', () => {
      cy.get('.header')
        .get('.top-header')
        .get('.actions')
        .find('a')
        .find('button')
        .should('contain.text', 'Simuler des affectations')
        .click()
        .location('pathname')
        .should('eq', '/reaffectateur')
  })

  it('Check that the button on top "Ajouter un agent" is there and when clicked, opens the right popin ', () => {
    cy.get('.header')
      .get('.top-header')
      .get('.actions')
      .find('button')
      .get('.add-collaborator')
      .should('contain.text', 'Ajouter un agent')
      .click()
      .location('pathname')
      .should('contain', '/resource-humaine')
      //Vérifier qu'on peut ajouter un agent !
  })

  it('Verify that when an agent’s card is clicked, it redirects to the full agent’s profile', () => {
    let userId = 0

    cy.get('.sub-content-list person-preview:first')
      .invoke('attr', 'id')
      .then((id) => {
        userId = id.split('-')[1];
        cy.get('.sub-content-list person-preview:first').within(() => {
          cy.get('.actions a').click();
        });
        cy.location('pathname').should('eq', `/resource-humaine/${userId}`);
      });
  })

  it('All categories ("Siege", "Greffe" and "Autour du magistrat") must be activated by default', () => {
      //Siege
      cy.get('.radio-border-left').first()
        .find('aj-radio-button')
        .should('have.class', 'selected')

      //Greffe
      cy.get('.radio-border-left').eq(1)
        .find('aj-radio-button')
        .should('have.class', 'selected')

      //Autour du magistrat
      cy.get('.radio-border-left').eq(2)
        .find('aj-radio-button')
        .should('have.class', 'selected')
  })
})