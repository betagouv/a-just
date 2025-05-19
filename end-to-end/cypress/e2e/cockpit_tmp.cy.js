describe('Cockpit Additional Tests', () => {
    beforeEach(() => {
        cy.login(); // Ensure user is logged in
        cy.visit('/cockpit');
        cy.wait(5000); // Wait for the page to load
    });

    it('Should verify default comparison to year N-1', () => {
        cy.window().then((win) => {
            const backupId = win.localStorage.getItem('backupId');
            const token = win.localStorage.getItem('token');
            const serverUrl = 'http://173.0.0.20:8081/api';

            cy.request({
                method: 'POST',
                url: `${serverUrl}/activities/get-last-month`,
                headers: { Authorization: token },
                body: { hrBackupId: backupId },
            }).then((response) => {
                expect(response.status).to.eq(200);

                const lastMonth = response.body.data.date;
                const endDate = new Date(lastMonth);
                endDate.setFullYear(endDate.getFullYear() - 1);

                const startDate = new Date(endDate);
                startDate.setMonth(endDate.getMonth() - 11);

                cy.get('.drop-down').should('contain.text', `${startDate.getFullYear()} - ${endDate.getFullYear()}`);
            });
        });
    });

    it('Should allow creating a custom comparison period', () => {
        const startDate = new Date();
        startDate.setMonth(startDate.getMonth() - 6);
        const endDate = new Date();

        cy.get('.actions button').first().click();
        cy.get('.drop-down .footer').contains('Personnaliser').click();

        cy.get('aj-popup .content .picker .first-section .action aj-date-select').first().click();
        cy.get('.mat-calendar-body-cell-content').contains(startDate.getFullYear()).click();
        cy.get('.mat-calendar-body-cell-content').contains(startDate.toLocaleString('default', { month: 'short' }).toUpperCase()).click();

        cy.get('aj-popup .content .picker .first-section .action aj-date-select').eq(1).click();
        cy.get('.mat-calendar-body-cell-content').contains(endDate.getFullYear()).click();
        cy.get('.mat-calendar-body-cell-content').contains(endDate.toLocaleString('default', { month: 'short' }).toUpperCase()).click();

        cy.get('aj-popup .save').click();
        cy.wait(2000);

        cy.get('.drop-down').should('contain.text', `${startDate.toLocaleString('default', { month: 'short' })} ${startDate.getFullYear()} - ${endDate.toLocaleString('default', { month: 'short' })} ${endDate.getFullYear()}`);
    });

    it('Should compare to another jurisdiction period', () => {
        // Placeholder: Requires API or UI details for jurisdiction comparison
        cy.log('Test for comparing to another jurisdiction period is not implemented yet.');
    });

    it('Should compare to a time reference benchmark', () => {
        // Placeholder: Requires API or UI details for time reference comparison
        cy.log('Test for comparing to a time reference benchmark is not implemented yet.');
    });

    it('Should verify PDF export functionality', () => {
        cy.get('.export-pdf-button').click();
        cy.wait(2000); // Wait for the export to complete

        cy.readFile('cypress/downloads/export.pdf').should('exist');
    });

    it('Should verify creation and redirection of a reference', () => {
        cy.get('.create-reference-button').click();
        cy.get('.reference-popup').should('be.visible');
        cy.get('.reference-popup .save').click();

        cy.url().should('include', '/references');
        cy.get('.reference-list').should('contain.text', 'New Reference');
    });

    it('Should verify selected reference appears in the comparison list', () => {
        cy.get('.comparison-list').within(() => {
            cy.get('.reference-item').contains('Selected Reference').should('exist');
        });
    });
});
        const lastMonth = response.body.data.date;
        const endDate = new Date(lastMonth);
        const startDate = new Date(endDate);
        startDate.setMonth(endDate.getMonth() - 11);

        cy.get('.dates-selector aj-date-select').first()
          .should('contain.text', startDate.getFullYear());
        cy.get('.dates-selector aj-date-select').eq(1)
          .should('contain.text', endDate.getFullYear());
      });
    });
  });

  it('should switch between "Données brut" and "Graphiques" modes', () => {
    cy.get('.switch-tab .brut').click().should('have.class', 'selected');
    cy.get('.switch-tab .analytique').click().should('have.class', 'selected');
  });

  it('should update UI based on selected agent category in "Données brut" mode', () => {
    cy.get('.switch-tab .brut').click();
    cy.get('.categories-switch .magistrats').click();
    cy.get('.contentieux-header-calculator .item').last()
      .should('contain.text', 'Temps moyen siège/ dossier observé');
    cy.get('.categories-switch .fonctionnaires').click();
    cy.get('.contentieux-header-calculator .item').last()
      .should('contain.text', 'Temps moyen greffe/ dossier observé');
  });

  it('should update dropdown selector when a custom period is chosen', () => {
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - 5);
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() - 1);

    cy.get('.actions button').first().click();
    cy.get('.drop-down .footer').contains('Personnaliser').click();

    cy.get('aj-popup .content .picker .first-section .action aj-date-select').first().click();
    cy.get('.mat-calendar-body-cell-content').contains(startDate.getFullYear()).click();
    cy.get('.mat-calendar-body-cell-content').contains(startDate.toLocaleString('default', { month: 'short' }).toUpperCase()).click();

    cy.get('aj-popup .content .picker .first-section .action aj-date-select').eq(1).click();
    cy.get('.mat-calendar-body-cell-content').contains(endDate.getFullYear()).click();
    cy.get('.mat-calendar-body-cell-content').contains(endDate.toLocaleString('default', { month: 'short' }).toUpperCase()).click();

    cy.get('aj-popup .save').click();
    cy.wait(2000);

    cy.get('.actions button').first().click();
    cy.get('.drop-down').should('contain.text', `${startDate.toLocaleString('default', { month: 'short' })} ${startDate.getFullYear()} - ${endDate.toLocaleString('default', { month: 'short' })} ${endDate.getFullYear()}`);
  });
});// filepath: end-to-end/cypress/e2e/cockpit.cy.test.js

describe('Cockpit Additional Tests', () => {
  beforeEach(() => {
    cy.login(); // Ensure user is logged in
    cy.visit('/cockpit');
    cy.wait(5000); // Wait for the page to load
  });

  it('Should handle empty state gracefully', () => {
    cy.intercept('POST', '**/activities/get-last-month', {
      statusCode: 200,
      body: { data: { date: null } },
    }).as('getLastMonth');

    cy.reload();
    cy.wait('@getLastMonth');

    cy.get('.dates-selector').should('contain.text', 'No data available');
  });

  it('Should redirect to login if token is invalid', () => {
    cy.window().then((win) => {
      win.localStorage.setItem('token', 'invalid-token');
    });

    cy.reload();
    cy.url().should('include', '/login');
  });

  it('Should display correct chart data in "Graphiques" mode', () => {
    cy.get('.switch-tab').get('.analytique').click();

    cy.intercept('POST', '**/chart-data', {
      statusCode: 200,
      body: { data: { chart: [10, 20, 30] } },
    }).as('getChartData');

    cy.wait('@getChartData');

    cy.get('.chart-container').should('be.visible');
    cy.get('.chart-bar').should('have.length', 3);
  });

  it('Should handle large datasets in "Données brut" mode', () => {
    cy.get('.switch-tab').get('.brut').click();

    cy.intercept('POST', '**/large-dataset', {
      statusCode: 200,
      body: { data: Array(1000).fill({ value: 'Test Data' }) },
    }).as('getLargeDataset');

    cy.wait('@getLargeDataset');

    cy.get('.data-table').should('be.visible');
    cy.get('.data-row').should('have.length', 1000);
  });
});