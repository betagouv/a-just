describe('Ventilateur', () => {

    beforeEach(() => {
        cy.login()
        cy.get('.introjs-tooltip-header')
            .get('.introjs-skipbutton')
            .click()
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
          
          //Vérifier qu'on peut ajouter un agent !!!
  })


    // it('All categories ("Siege", "Greffe" and "Autour du magistrat") must be activated by default', () => {
    //     //Siege
    //     cy.get('.radio-border-left').first()
    //     .find('aj-radio-button')
    //     .should('have.class', 'selected')

    //     //Greffe
    //     cy.get('.radio-border-left').eq(1)
    //     .find('aj-radio-button')
    //     .should('have.class', 'selected')

    //     //Autour du magistrat
    //     cy.get('.radio-border-left').eq(2)
    //     .find('aj-radio-button')
    //     .should('have.class', 'selected')

    // })
})