import user from "../../fixtures/user.json";
import { accessUrlList } from "../../support/userAcess";
import { loginApi, getUserDataApi, updateUserAccounatApi } from "../../support/api";

describe("Test d'accés aux pages", () => {
    let userId;
    let token;
    let ventilations = [];

    before(() => {
        //Login to get the admin user token so we can retireve user data
        loginApi(user.email, user.password).then((resp) => {
            userId = resp.body.user.id;
            token = resp.body.token;

            // Get user data to check access
            getUserDataApi(token).then((resp) => {

                // Give all access to the user
                ventilations = resp.body.data.backups.map(v => v.id);
                const accessIds = accessUrlList.map((access) => access.id);
                
                updateUserAccounatApi({
                    userId,
                    accessIds,
                    ventilations,
                    token
                })
          })
      })
    });

    after(() => {
        // Reset user access to default
        const accessIds = accessUrlList.map((access) => access.id);
        updateUserAccounatApi({
            userId,
            accessIds,
            ventilations,
            token
        });
    })


    it("User with acces to panorama only, should not have access to other pages", () => {

        cy.login()

        // Filter access list to get only the Panorama access
        const accessIds = accessUrlList.filter(access => access.label === 'panorama').map((access) => access.id);
        
        updateUserAccounatApi({
            userId,
            accessIds,
            ventilations,
            token
        }).then(() => {
            cy.visit('/panorama')
                .location('pathname')
                .should('contain', '/panorama')
            accessUrlList.forEach((access) => {
                if (access.label !== 'panorama') {
                    cy.visit('/' + access.label)
                        .location('pathname')
                        .should('not.contain', access.label);
                }
            });
        });
    });

    it("User with access to specific pages should not have access to others", () => {
        cy.login();
      
        // Parcourir toutes les URLs définies dans accessUrlList
        accessUrlList.forEach((access) => {
          const accessIds = [access.id]; // Autoriser uniquement l'accès à la page actuelle
      
          // Mettre à jour les droits d'accès pour l'utilisateur
          updateUserAccounatApi({
            userId,
            accessIds,
            ventilations,
            token,
          }).then(() => {
            // Vérifier que l'utilisateur peut accéder à la page autorisée
            cy.visit(`/${access.label}`)
              .location("pathname")
              .should("contain", access.label);
      
            // Vérifier que l'utilisateur ne peut pas accéder aux autres pages
            accessUrlList.forEach((otherAccess) => {
              if (otherAccess.id !== access.id) {
                cy.visit(`/${otherAccess.label}`, { failOnStatusCode: false })
                  .location("pathname")
                  .should("not.contain", otherAccess.label);
              }
            });
          });
        });
      });
})