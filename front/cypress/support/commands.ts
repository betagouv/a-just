import user from '../fixtures/user.json'

/// <reference types="cypress" />
// ***********************************************
// This example commands.ts shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************
//
//
// -- This is a parent command --
// Cypress.Commands.add('login', (email, password) => { ... })
//
//
// -- This is a child command --
// Cypress.Commands.add('drag', { prevSubject: 'element'}, (subject, options) => { ... })
//
//
// -- This is a dual command --
// Cypress.Commands.add('dismiss', { prevSubject: 'optional'}, (subject, options) => { ... })
//
//
// -- This will overwrite an existing command --
// Cypress.Commands.overwrite('visit', (originalFn, url, options) => { ... })
//
// declare global {
//   namespace Cypress {
//     interface Chainable {
//       login(email: string, password: string): Chainable<void>
//       drag(subject: string, options?: Partial<TypeOptions>): Chainable<Element>
//       dismiss(subject: string, options?: Partial<TypeOptions>): Chainable<Element>
//       visit(originalFn: CommandOriginalFn, url: string, options: Partial<VisitOptions>): Chainable<Element>
//     }
//   }
// }
declare namespace Cypress {
    interface Chainable<Subject = any> {
        login(): Chainable<any>;
    }
}

let storage = null

Cypress.Commands.add('getLocalStorage', () => {
    
})


Cypress.Commands.add('login', () => {
    cy.visit('http://localhost:4200/connexion');
    cy.get('form')
        .get('input[type=email]').type(user.email)
        .get('input[type=password]').type(user.password)
        .get('input[type=submit]').click()
        storage = cy.getAllSessionStorage()
})

Cypress.Commands.add('restoreLocalStorage', () => {
    localStorage.setItem()
})