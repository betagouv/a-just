import { getShortMonthString } from "../../support/utils/dates"

describe('Cockpit', () => {
  before(() => {
    cy.login()
    cy.visit('/cockpit')
    cy.wait(10000)
  })

  it('Check the name page is displayed', () => {
    cy.get('.title-with-doc')
      .get('h3')
      .should('contain.text', 'Cockpit')
  })

  it('Check that the doc button is accessible', () => {
    cy.get(".top-header")
        .get(".top-header-back-title .title-with-doc").get('aj-help-button').click()

    cy.wait(1000)
    cy.get('.panel-helper .panel-header').get('.panel-header-closing-row').should('contain.text', 'Cockpit')

    cy.get('.panel-header-closing-row').get('.ri-close-line').click()
  })

  it("Check that we can siwtch between 'Données brut' and 'Graphiques' mode ", () => {
    cy.get('.switch-tab')
      .get('.brut')
      .click()
      .should('have.class', 'selected')

    cy.get('.switch-tab')
      .get('.analytique')
      .click()
      .should('have.class', 'selected')
  })

  it("Check that the default period is 12 months (until last month available for data)", () => {
    
    cy.get('.switch-tab')
      .get('.brut')
      .click()

    cy.window().then((win) => {
      const backupId = win.localStorage.getItem('backupId');
      const token = win.localStorage.getItem('token');
  
      // Get the latest available month
      const serverUrl = 'http://173.0.0.20:8081/api' || 'http://localhost:8081/api';
      cy.log('Server URL:', serverUrl);
      cy.request({
        method: 'POST',
        url: `${serverUrl}/activities/get-last-month`,
        headers: {
          'Authorization': `${token}`
        },
        body: { hrBackupId: backupId }
      }).then((response) => {
        expect(response.status).to.eq(200);
  
        const lastMonth = response.body.data.date;
  
        const endDate = new Date(lastMonth);
        const startDate = new Date(endDate);
        startDate.setMonth(endDate.getMonth() - 11);
  
        cy.log('Start Date:', startDate.getDate() + '/' + getShortMonthString(startDate) + '/' + startDate.getFullYear());
        cy.log('End Date:', endDate.getDate() + '/' + getShortMonthString(endDate) + '/' + endDate.getFullYear());

        cy.get('.dates-selector')
          .find('aj-date-select')
          .first()
          .should('contain.text', getShortMonthString(startDate))
          .should('contain.text', startDate.getFullYear());
  
        cy.get('.dates-selector')
          .find('aj-date-select')
          .eq(1)
          .should('contain.text', getShortMonthString(endDate))
          .should('contain.text', endDate.getFullYear());
      });
    });
  });

  it("Check that in the 'Données brutes' mode, the 'Temps moyen ... / dossier observé' change according to the selected agent category", () => {
    cy.get('.switch-tab')
      .get('.brut')
      .click()

    cy.get('.categories-switch').get('.magistrats').click().then(() => {
      cy.get('.contentieux-header-calculator').within(() => {
        cy.get('.item').last().should('contain.text', 'Temps moyen siège/ dossier observé')
      })
    })

    cy.get('.categories-switch').get('.fonctionnaires').click().then(() => {
        cy.get('.contentieux-header-calculator').within(() => {
          cy.get('.item').last().should('contain.text', 'Temps moyen greffe/ dossier observé')
        })
      })
  })

  it("Check that in the 'Graphiques' mode, the 'Temps moyen ... / dossier observé' change according to the selected agent category", () => {

    cy.get('.switch-tab')
      .get('.analytique')
      .click()
    
    cy.get('.categories-switch').get('.magistrats').click().then(() => {
      cy.get('.container-colum').last().within(() => {
        cy.get('.title-section').should('contain.text', 'Temps moyen Siège')
      })
    })

    cy.get('.categories-switch').get('.fonctionnaires').click().then(() => {
      cy.get('.container-colum').last().within(() => {
        cy.get('.title-section').should('contain.text', 'Temps moyen Greffe')
      })
    })
  })

  it("Check that the background color of the selected ETPT category (siege/geffe) change according to the selected agent category", () => {
    
    cy.get('.switch-tab')
      .get('.brut')
      .click()

    cy.get('.categories-switch').get('.magistrats').click().then(() => {
      cy.get('.contentieux-header-calculator').within(() => {
        cy.get('.item').eq(5).should('have.css', 'background-color', 'rgb(227, 227, 253)')
      })
    })

    cy.get('.categories-switch').get('.fonctionnaires').click().then(() => {
        cy.get('.contentieux-header-calculator').within(() => {
        cy.get('.item').eq(6).should('have.css', 'background-color', 'rgb(254, 231, 252)')
        })
      })
  })

  it("Check that on 'Graphiques' mode, the 'Voir les détails' & 'Masquer les détails' buttons work", () => {
    cy.get('.switch-tab')
      .get('.analytique')
      .click()

    cy.get('.scroll-container').children().each(($el) => {
        const $button = Cypress.$($el).find('.details');

        cy.log('Button length:', $button.length)
        if ($button.length) {
          cy.wrap($button)
            .should('have.class', 'no-print')
            .should('contain.text', 'Voir les détails');

          cy.wrap($button).click();

          cy.wrap($button)
            .should('contain.text', 'Masquer les détails');
        }
    })
  })

  it('Comparator | Check that the selector displays year N-1 by default', () => {

    cy.window().then((win) => {
      const backupId = win.localStorage.getItem('backupId');
      const token = win.localStorage.getItem('token');
  
      // Get the latest available month
      const serverUrl = 'http://173.0.0.20:8081/api' || 'http://localhost:8081/api';
      cy.request({
        method: 'POST',
        url: `${serverUrl}/activities/get-last-month`,
        headers: {
          'Authorization': `${token}`
        },
        body: { hrBackupId: backupId }
      })
      .then((response) => {
        expect(response.status).to.eq(200);

        const lastMonth = response.body.data.date;

        const endDate = new Date(lastMonth);
        endDate.setFullYear(endDate.getFullYear() - 1);

        const startDate = new Date(endDate);
        startDate.setMonth(endDate.getMonth() - 11);

        cy.get('.actions').within(() => {
          cy.get('button')
            .first()
            .click()
        })
        cy.get('.drop-down')
          .should('be.visible')
          .should('contain.text',  `${getShortMonthString(startDate) + ` ${startDate.getFullYear()}`} - ${getShortMonthString(endDate) + ` ${endDate.getFullYear()}`}` )
      })
    })
    cy.get('body').click(0, 0);
  })

  it('Comparateur | Check that if I choose a period, it apperas in the selector', () => {
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - 5);
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() - 1);
    
    cy.get('.actions').within(() => {
      cy.get('button')
        .first()
        .click()
    })
    
    cy.get('.drop-down')
      .should('be.visible')
      .get('.footer').should('contain.text', 'Personnaliser')
      .click()

    cy.get('aj-popup').within(() => {
      cy.get('.content .picker .first-section .action aj-date-select')
        .first()
        .click()
    })

    cy.get('.mat-datepicker-content').should('be.visible')
      .get('button[aria-label="Choose date"]').click()
      .get('button[aria-label="Choose month and year"]').click()
      .get('.mat-calendar-body-cell-content').contains(startDate.getFullYear()).click()
      .get('.mat-calendar-body-cell-content').contains(getShortMonthString(startDate).toUpperCase()).click()

    cy.get('aj-popup').within(() => {
      cy.get('.content .picker .first-section .action aj-date-select')
        .eq(1)
        .click()
    })

    cy.get('.mat-datepicker-content').should('be.visible')
      .get('button[aria-label="Choose date"]').click()
      .get('button[aria-label="Choose month and year"]').click()
      .get('.mat-calendar-body-cell-content').contains(endDate.getFullYear()).click()
      .get('.mat-calendar-body-cell-content').contains(getShortMonthString(endDate).toUpperCase()).click()

    cy.get('aj-popup').within(() => {
      cy.get('.save').click()
    })
    
    cy.wait(5000)

    cy.get('.actions').within(() => {
      cy.get('button')
        .first()
        .click()
    })
    cy.get('.drop-down')
      .should('be.visible')
      .contains(`${getShortMonthString(startDate) + ` ${startDate.getFullYear()}`} - ${getShortMonthString(endDate) + ` ${endDate.getFullYear()}`}` )
      .parent('.item')
      .within(() => {
        cy.get('.radio').should('have.class', 'filled')
      })

  })

  /*it('Check that we can change the period', () => {
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - 5);

    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() - 1);

    cy.get('.dates-selector')
      .find('aj-date-select')
      .first()
      .click()
      .get('mat-datepicker')
      .get('.mat-calendar-period-button').click()
      .get('button[aria-label="Choose month and year"]').click()
      .get('.mat-calendar-body-cell-content').contains(startDate.getFullYear()).click()
      .get('.mat-calendar-body-cell-content').contains(getShortMonthString(startDate).toUpperCase()).click()

    cy.get('.dates-selector')
      .find('aj-date-select')
      .eq(1)
      .click()
      .get('mat-datepicker')
      .get('button[aria-label="Choose date"]').click()
      .get('button[aria-label="Choose month and year"]').click()
      .get('.mat-calendar-body-cell-content').contains(endDate.getFullYear()).click()
      .get('.mat-calendar-body-cell-content').contains(getShortMonthString(endDate).toUpperCase()).click()


    cy.get('.dates-selector')
      .find('aj-date-select')
      .first()
      .should('contain.text', getShortMonthString(startDate))
      .should('contain.text', startDate.getFullYear());
    cy.get('.dates-selector')
      .find('aj-date-select')
      .eq(1)
      .should('contain.text', getShortMonthString(endDate))
      .should('contain.text', endDate.getFullYear());
  })*/
})