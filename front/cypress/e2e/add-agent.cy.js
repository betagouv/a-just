import { getShortMonthString } from "../support/utils/dates"

describe("Ajout d'un agent", () => {
  before(() => {
    cy.login()
    cy.visit('/ventilations')

    cy.get('.introjs-tooltip-header')
        .get('.introjs-skipbutton')
        .click()
    cy.get('#wrapper-contener')
      .get('.header')
      .get('.top-header')
      .get('.actions')
      .find('button.add-collaborator')
      .should('contain.text', 'Ajouter un agent')
      .click()
      .location('pathname')
      .should('contain', '/resource-humaine')
  })

  // it('Check that we can cancel', () => {
  //   cy.get('.sticky-action-footer').within(() => {
  //     cy.get('button').first().click()
  //   })
  // })

  it('Add username', () => {
    cy.get('.second-row')
    cy.get('#firstName')
      .type('Agent')
    cy.get('#lastName')
      .type('test')
    cy.get('#matricule')
      .type("123456")
  })

  it('Select incoming date', () => {
    const now = new Date()

    const month = now.getMonth() - 3
    const date = new Date(now.setMonth(month))

    cy.get('.dates').get('aj-date-select').first()
      .click().get('mat-datepicker')
      //select Year
      .get('button[aria-label="Choose month and year"]').click()
      .get('.mat-calendar-body-cell-content').contains(date.getFullYear()).click()
      //select month
      .get('.mat-calendar-body-cell-content').contains( getShortMonthString(date).toUpperCase() ).click()
      //select date
      .get('.mat-calendar-body-cell-content').contains(date.getDay()).click()

  })

  it('Select leaving date', () => {
    const date = new Date()
    
    cy.get('.dates').get('aj-date-select').eq(1)
      .click().get('mat-datepicker')
      //select Year
      .get('button[aria-label="Choose month and year"]').click()
      .get('.mat-calendar-body-cell-content').contains(date.getFullYear()).click()
      //select month
      .get('.mat-calendar-body-cell-content').contains( getShortMonthString(date).toUpperCase() ).click()
      //select date
      .get('.mat-calendar-body-cell-content').contains(date.getDate()).click()
  })

  it('Select Catégorie', () => {
    cy.get('.grid-triple')
      .get('.admin-element')
      .first().within(() => {
          cy.get('select').select('Magistrat')
      })
  })

  it('Select Fonction', () => {
    cy.get('.grid-triple')
      .get('.admin-element')
      .eq(1).within(() => {
          cy.get('select').select('JUGE')
      })
  })

  it('Set ETPT', () => {
    cy.get('.grid-triple')
      .get('.admin-element')
      .eq(2).within(() => {
          cy.get('input').type('0.5')
      })
  })

  it("Check 'Feuille des temps' download works", () => {
    cy.get('.new-ventilation')
    cy.get('#admin').within(() => {
        cy.get('.top')
          .get('.drop-down-container')
          .get('#drop-down2')
          .click()
        cy.get('#timesheet')
          .get('.download')
          .click()
    })
    // Check file is downloaded
    cy.verifyDownload('Feuille_de_temps_Modèle.xlsx')
  })

  it("Check user can download 'Calculatrice des temps de ventilations'", () => {
    cy.get('.activities').within(() => 
        cy.get('.top')
        .get('.download').click()
    )
    cy.wait(2000)
    // Check file is downloaded
    cy.verifyDownload('Calculatrice_de_ventilation_du_temps_par_activité_A-JUST_MAG_et_GRF.xlsx')
  })


  it('Add activities', () => {

    cy.window().then((win) => {
      cy.stub(win, 'prompt').callsFake((message) => {
        expect(message).to.equal('Nouveau pourcentage ?');
        return '25';
      });
    });

    const integers = []
    let randInt = Math.floor(Math.random() * 11)
    cy.get('.activities')
    .get('panel-activities')
    
    for(let i = 0; i < 4; i++) {
      while (integers.includes(randInt))
        randInt = Math.floor(Math.random() * 11)
      integers.push(randInt)
      
     let pos = integers[integers.length - 1]
      cy.get('.activities-panel').within(() => {
        cy.get('.sub-item')
          .eq(pos)
          .click()
      })
      cy.get('.sub-panel-activites')
        .get('.group-sub-item').within(() => {
          cy.get('.sub-item')
            .eq(0)
            .click()
        })
    } 
  })

  it('Check if we can add a start date to the situation', () => {
    const now = new Date()
    const month = now.getMonth() - 3
    const date = new Date(now.setMonth(month))

    cy.get('.bottom-container')
      .get('.date-start').within(() => {
       cy.get('aj-date-select')
          .click().get('mat-datepicker')
          
      })//select Year
      .get('button[aria-label="Choose month and year"]').click()
      .get('.mat-calendar-body-cell-content').contains(date.getFullYear()).click()
      //select month
      .get('.mat-calendar-body-cell-content').contains( getShortMonthString(date).toUpperCase() ).click()
      //select date
      .get('.mat-calendar-body-cell-content').contains(date.getDay()).click()
  })

  it('Checking that we can add unavailabilities', () => {
    const now = new Date()
    const startMonth = now.getMonth() - 1
    const endMonth = now.getMonth()
    const startDate = new Date(now.setMonth(startMonth))
    const endDate = new Date(now.setMonth(endMonth))

    cy.get('.bottom-container')
      .get('.indisponibilities').within(() => {
          cy.get('.indispo-header')
            .get('button').click()
      })
      .get('aj-popup').within(() => {
        cy.get('.content')
          .get('.form')
          .get('select').select('Décharge syndicale')
          .get('.grid-double')
          .get('aj-date-select').first().click()
          .get('mat-datepicker')
      })
      .get('button[aria-label="Choose month and year"]').click()
      .get('.mat-calendar-body-cell-content').contains(startDate.getFullYear()).click()
      //select month
      .get('.mat-calendar-body-cell-content').contains( getShortMonthString(startDate).toUpperCase() ).click()
      //select date
      .get('.mat-calendar-body-cell-content').contains(startDate.getDay()).click()
      
      .get('aj-popup').within(() => {
        cy.get('.content')
          .get('.grid-double')
          .get('aj-date-select').eq(1).click()
          .get('mat-datepicker')
      })
      .get('button[aria-label="Choose month and year"]').click()
      .get('.mat-calendar-body-cell-content').contains(endDate.getFullYear()).click()
      //select month
      .get('.mat-calendar-body-cell-content').contains( getShortMonthString(endDate).toUpperCase() ).click()
      //select date
      .get('.mat-calendar-body-cell-content').contains(endDate.getDay()).click()


      .get('aj-popup').within(() => {
        cy.get('.content')
          .get('.form').within(() => {
            cy.get('#input-indispo')
            .clear()
            .type(100)
          })

        cy.get('.actions')
          .get('button')
          .contains('Enregister')
          .click()
      })
  })

  it('Register new agent and his activities', () => {
    cy.get('.sticky-action-footer').within(() => {
      cy.get('button').eq(1).click()
    })
  })

  it("Check 'return' buton works", () => {
    cy.get('.first-row').within(() => {
      //cy.get('#backButton')
      cy.get('aj-back-button')
        .click()
    })
  })

})