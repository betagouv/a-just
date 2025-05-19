describe('Panorama page', () => {
  before(() => {
    cy.login()
  })

  it('Should display main menu and submenu items', () => {
    cy.get('.menu-scrollable a').as('menuLinks')

    cy.get('@menuLinks').should('contain.text', 'Panorama')
    cy.get('@menuLinks').should('contain.text', 'Ventilateur')
    cy.get('@menuLinks').should('contain.text', "Données d'activité")
    cy.get('@menuLinks').should('contain.text', 'Cockpit')
    cy.get('@menuLinks').should('contain.text', 'Simulateur')
    cy.get('@menuLinks').should('contain.text', 'Outils')
    cy.get('@menuLinks').should('contain.text', 'Aide')
    cy.get('@menuLinks').should('contain.text', 'Nous contacter')

    cy.get('.tools').click()
    cy.get('.sub-tools').within(() => {
      cy.contains('La nomenclature')
      cy.contains('La calculatrice')
      cy.contains('Les extracteurs')
      cy.contains('Référentiels de temps moyens')
    })
  })

  it("Should show 'Effectifs' and 'Données d'activité' tabs", () => {
    cy.get('.panorama-container .header-panorama')
      .should('contain.text', 'Effectifs')
      .and('contain.text', "Données d'activité")
  })

  it("Should display the 3 'Effectifs' sections", () => {
    cy.get('.workforce-panel').within(() => {
      cy.get('h3').eq(0).should('contain.text', 'Composition des effectifs')
      cy.get('h3').eq(1).should('contain.text', 'Actualisation des fiches')
    })

    cy.get('.workforce-change').should('contain.text', 'changement').and('contain.text', 'effectifs')
  })

  it("Should display the 3 'Données d’activité' sections", () => {
    cy.get('activities-last-modifications h3').should('contain.text', 'Dernières modifications')
    cy.get('activities-last-disponibilities h3').should('contain.text', 'Dernières données disponibles')
    cy.get('activities-to-complete h3').should('contain.text', "Les données d'activité à compléter")
  })

  it("Should display 3 cards in 'Composition des effectifs'", () => {
    cy.get('.workforce-panel .cards .categoryType')
      .should('contain.text', 'Siège')
      .and('contain.text', 'Greffe')
      .and('contain.text', 'Autour du magistrat')
  })

  it("Should show sub-categories and CLE for first 2 agent categories", () => {
    cy.get('.workforce-panel .cards .category').each(($el, index) => {
      if (index < 2) {
        cy.wrap($el).within(() => {
          cy.get('.middle').should('contain.text', 'Personnels CLE')
          cy.get('.footer .subCategory .categoryType').as('subcats')
          cy.get('@subcats').should('contain.text', 'Titulaire')
          cy.get('@subcats').should('contain.text', 'Placé')
          cy.get('@subcats').should('contain.text', 'Contractuel')
        })
      }
    })
  })

  it("Should save CLE values correctly", () => {
    const cleValues = ['4', '32', '10']

    cleValues.forEach((value, index) => {
      cy.get('.workforce-panel workforce-composition .cards .category')
        .eq(index)
        .find('.middle input')
        .clear()
        .type(value)
    })

    cy.reload()

    cleValues.forEach((expectedValue, index) => {
      cy.get('.workforce-panel workforce-composition .cards .category')
        .eq(index)
        .find('.middle input')
        .should('have.value', expectedValue)
    })
  })

  it("Should display 3 cards in 'Actualisation des fiches'", () => {
    cy.get('.workforce-panel .category .content-wrapper')
      .should('contain.text', 'Siège')
      .and('contain.text', 'Greffe')
      .and('contain.text', 'Autour du magistrat')
  })

  it("Should show 3 columns in 'Actualisation des fiches'", () => {
    cy.get('.workforce-panel .header-titles').within(() => {
      cy.get('.label').should('contain.text', 'Effectifs')
      cy.get('.percent').should('contain.text', '% ventilé')
      cy.get('.update-title').should('contain.text', 'Dernière MAJ')
    })
  })

  const verifyRedirectionWithFilter = (index, expectedFilterIndex) => {
    cy.get('.workforce-panel .category .dark-arrow')
      .eq(index)
      .click()

    cy.location('pathname').should('eq', '/ventilations')

    cy.get('.radio-border-left').each(($el, idx) => {
      const isSelected = idx === expectedFilterIndex
      cy.wrap($el).find('aj-radio-button')
        .should(isSelected ? 'have.class' : 'not.have.class', 'selected')
    })

    cy.visit('/panorama')
    cy.location('pathname').should('eq', '/panorama')
  }

  it("Should redirect with only 'Siège' filter active", () => {
    verifyRedirectionWithFilter(0, 0)
  })

  it("Should redirect with only 'Greffe' filter active", () => {
    verifyRedirectionWithFilter(1, 1)
  })

  it("Should redirect with only 'EAM' filter active", () => {
    verifyRedirectionWithFilter(2, 2)
  })
})