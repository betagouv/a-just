
describe('Panorama page', () => {
  before(() => {
    cy.login()
    // cy.visit('/panorama')
  })
    
  it('Check that we have the menu', () => {
    cy.get('.menu-scrollable')
    cy.get('a')
        .should('contain.text', 'Panorama')
        .should('contain.text', 'Ventilateur')
        .should('contain.text', "ativité")
        .should('contain.text', 'Cockpit')
        .should('contain.text', 'Simulateur')
        .should('contain.text', 'Outils')
        .should('contain.text', 'Aide')
        .should('contain.text', 'Nous contacter')
    // Submenu for tools
    cy.get('.tools')
        .click()
        .get('.sub-tools')
        .should('contain.text', 'La nomenclature')
        .should('contain.text', 'La calculatrice')
        .should('contain.text', "Les extracteurs")
        .should('contain.text', 'Référentiels de temps moyens')

  })

    it("Check that we have two tabs = 'Effectifs' and 'Données d'activité", () => {
      cy.get('.panorama-container')
        .get('.header-panorama')
        .should('contain.text', 'Effectifs')
        .should('contain.text', "Données d'activité")
    })

  it("Check that we have three sections on 'Effectifs' = 'Composition des effectifs' + 'Actualisation des fiches' + 'changement dans les effectifs' ", () => {
    cy.get('.container-panorama')
      .get('.workforce-panel').within(() => {
        cy.get('h3')
          .first()
          .contains('Composition des effectifs')
        cy.get('h3')
          .eq(1)
          .contains('Actualisation des fiches')
      })
      .get('.workforce-change')
      .contains(/changement(s)? dans les effectifs/)
  })

  it("Check that we have three sections inside 'Les données d’activité' = 'Dernières modifications' + 'Dernières données disponibles' + 'Les données d'activité à compléter' ", () => {
    cy.get('.container-panorama')
        .get('.activities-panel')
        .find('activities-last-modifications')
        .find('h3')
        .should('contain.text', 'Dernières modifications')
      
    cy.get('.container-panorama')
      .get('.activities-panel')
      .get('.left-panel')
      .find('activities-last-disponibilities')
      .find('h3')
      .should('contain.text', 'Dernières données disponibles')

    cy.get('.container-panorama')
      .get('.activities-panel')
      .get('.left-panel')
      .find('activities-to-complete')
      .find('h3')
      .should('contain.text', "Les données d'activité à compléter")
  })

  it("Check that we have 3 cards inside 'Composition des effectifs' = 'Siege' + 'Greffe' + 'Autour dumagistrat' ", () => {
    cy.get('.container-panorama')
      .get('.workforce-panel')
      .get('.cards')
      .get('.category')
      .get('.header')
      .get('.header-wrapper')
      .get('.categoryType')
      .should('contain.text', 'Siège')
      .should('contain.text', 'Greffe')
      .should('contain.text', 'Autour du magistrat')
  })

  it("Check that for the two first cards ('Siege' and 'Greffe') inside 'Composition des effectifs' we have three sub-categories (Titulaires + Placés + Contractuels) and 'Personnels CLE' ", () => {
    cy.get('.container-panorama')
      .get('.workforce-panel')
      .get('.cards')
      .get('.category')
      .get('.middle')
      .should('contain.text', 'Personnels CLE')
      .get('.footer')
      .get('.subCategory')
      .get('.categoryType')
      .should('contain.text', 'Titulaire')
      .should('contain.text', 'Placé')
      .should('contain.text', 'Contractuel')
  })

  it("Check that if we add a CLE value for each agent category, they are well saved", () => {
    const cleValues = ['4', '32', '10'];

    cy.get('.container-panorama')
    .find('.workforce-panel workforce-composition')
    .within(() => {
      cleValues.forEach((value, index) => {
        cy.get('.cards')
          .find('.category')
          .eq(index)
          .within(() => {
            cy.get('.middle input').clear().type(value);
          });
      });
    });

    cy.wait(1000)

    cy.reload().then(() => {
      cy.get('.container-panorama')
        .find('.workforce-panel workforce-composition')
        .within(() => {
          cleValues.forEach((expectedValue, index) => {
            cy.get('.cards')
              .find('.category')
              .eq(index)
              .within(() => {
                cy.get('.middle input').should('have.value', expectedValue);
              });
          });
        });
    });
  })

  it("Check that we have 3 cards in 'Actualisation des fiches'", () => {
    cy.get('.container-panorama')
      .get('.workforce-panel')
      .get('.category')
      .get('.content-wrapper')
      .should('contain.text', 'Siège')
      .should('contain.text', 'Greffe')
      .should('contain.text', 'Autour du magistrat')
  })

  it("Check that we have 3 columns in 'Actualisation des fiches'", () => {
    cy.get('.container-panorama')
      .get('.workforce-panel')
      .get('.header-titles')
      .get('.label')
      .should('contain.text', 'Effectifs')
      .get('.percent')
      .should('contain.text', '% ventilé')
      .get('.update-title')
      .should('contain.text', 'Dernière MAJ')
  })

  it("Check that we can click on a category inside 'Actualisation des fiches' and be redirected to 'Ventilateur' with only 'Siege' filter activated", () => {
    cy.get('.container-panorama')
      .get('.workforce-panel')
      .get('.category')
      .get('.content-wrapper')
      .get('.arrow')
      .get('.dark-arrow').first() // get "Siege" category
      .click()
    cy.location('pathname')
      .should('eq', '/ventilations')
    cy.get('.radio-border-left').first()
      .find('aj-radio-button')
      .should('have.class', 'selected')
  })
})