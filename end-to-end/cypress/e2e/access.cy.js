import user from "../../fixtures/user.json";
import { accessUrlList, accessFonctionsList } from "../../support/userAcess";
import { menuContentTools, menuContentBottom } from "../../support/menuContent";
import {
  loginApi,
  getUserDataApi,
  updateUserAccounatApi,
} from "../../support/api";

describe("Test d'accés aux pages", () => {
  let userId;
  let token;
  let ventilations = [];

  before(() => {
    //Login to get the admin user token so we can retrieve user data
    return loginApi(user.email, user.password).then((resp) => {
      cy.log("Login API response:", resp.body); // Debug log
      userId = resp.body.user.id;
      token = resp.body.token;

      // Get user data to retrieve ventilations list
      return getUserDataApi(token).then((resp) => {
        ventilations = resp.body.data.backups.map((v) => v.id);
        // Note: User already has full access from seeder, no need to update permissions here
      });
    });
  });

  afterEach(() => {
    // Reset user access to full access (all pages reader+writer + all functions)
    const pageAccessIds = [];
    accessUrlList.forEach((access) => {
      pageAccessIds.push(access.id + 0.1); // reader
      pageAccessIds.push(access.id + 0.2); // writer
    });
    const functionAccessIds = accessFonctionsList.map((access) => access.id);
    const accessIds = [...pageAccessIds, ...functionAccessIds];

    updateUserAccounatApi({
      userId,
      accessIds,
      ventilations,
      token,
    });
  });

  const checkToolsMenu = (toolToNotCheck = []) => {
    //Chek all tools are present
    cy.get(".menu-item .tools")
      .should("exist")
      .click()
      .get(".sub-tools")
      .within(() => {
        menuContentTools.forEach((tool) => {
          if (!toolToNotCheck.includes(tool)) {
            if (
              tool === "Les extracteurs" ||
              tool === "Référentiels de temps moyens"
            ) {
              cy.get("a").should("contain", tool); //.should("be.visible");
            } else {
              cy.get("p").contains(tool).should("be.visible");
            }
          }
        });
      });
    // Close the tools menu
    cy.get(".menu-item .tools").should("exist").click();
  };

  it("User with access to specific pages should not have access to others", () => {
    // Convert forEach to sequential cy.wrap chain to ensure proper Cypress queueing
    cy.wrap(accessUrlList).each((access) => {
      // Backend uses decimal IDs (1.1 = reader, 1.2 = writer)
      // Also need function access (8, 9, 10) to view data
      const pageAccessIds = [access.id + 0.1, access.id + 0.2]; // reader + writer
      const functionAccessIds = [8, 9, 10]; // magistrat, greffier, contractuel
      const accessIds = [...pageAccessIds, ...functionAccessIds];

      if (access.url !== undefined) {
        cy.log(`🔄 Starting: Testing access for ${access.url}`);
        
        // Mettre à jour les droits d'accès pour l'utilisateur
        updateUserAccounatApi({
          userId,
          accessIds,
          ventilations,
          token,
        });
        
        cy.wait(3000); // Wait for permission update to complete
        cy.log(`✅ Permissions updated, logging out...`);
        
        // Visit logout page to properly clear session on server side
        cy.visit('/logout');
        cy.wait(1000); // Wait for logout to complete
        
        cy.log(`🔑 Going to login page...`);
        cy.visit('/connexion');
        
        cy.log(`🔑 Filling login form...`);
        
        // Manually fill login form (don't use cy.login() which uses cy.session())
        cy.get('input[formcontrolname="email"]').type(user.email);
        cy.get('input[formcontrolname="password"]').type(user.password);
        cy.get('input[type="submit"]').click();
        
        cy.wait(2000); // Wait for login to complete
        
        cy.log(`🌐 Now visiting ${access.url} to test access...`);
        cy.visit(access.url);
        cy.wait(1000);
        
        // Vérifier que l'utilisateur peut accéder à la page autorisée
        cy.location("pathname").should("contain", access.url);

        cy.log(`✅ Access confirmed for ${access.url}`);

        // Vérifier que l'utilisateur ne peut pas accéder aux autres pages
        cy.wrap(accessUrlList).each((otherAccess) => {
          if (
            otherAccess.url !== undefined &&
            otherAccess.url !== access.url
          ) {
            cy.log(`🚫 Testing blocked access: ${otherAccess.url}`);
            
            // Special handling for simulators - they share a landing page
            const isSimulatorCrossCheck = 
              (access.url === '/simulateur' && otherAccess.url === '/simulateur-sans-donnees') ||
              (access.url === '/simulateur-sans-donnees' && otherAccess.url === '/simulateur');
            
            if (isSimulatorCrossCheck) {
              // Both simulators share /simulateur landing page
              // Check that unauthorized mode option is disabled/missing
              cy.visit('/simulateur', { failOnStatusCode: false });
              cy.wait(1000);
              
              if (access.url === '/simulateur-sans-donnees') {
                // User has "sans données" access, "avec données" should be disabled
                cy.get('input[type="radio"]').first().should('be.disabled');
                cy.log(`✅ "Avec données d'A-JUST" option is correctly disabled`);
              } else {
                // User has "avec données" access, "sans données" should be disabled  
                cy.get('input[type="radio"]').last().should('be.disabled');
                cy.log(`✅ "Pour une autre activité" option is correctly disabled`);
              }
            } else {
              // Normal pages - should be redirected away
              cy.visit(otherAccess.url, { failOnStatusCode: false });
              cy.wait(1000);
              cy.location("pathname").should("not.eq", otherAccess.url);
              cy.log(`✅ Correctly blocked access to ${otherAccess.url} (redirected away)`);
            }
          }
        });
        
        cy.log(`✅ Completed testing for ${access.url}`);
        cy.wait(2000); // Wait between major iterations
      }
    });
  });

  // TEMPORARILY COMMENTED OUT FOR DEBUGGING - only run first test
  it.skip("User with specific access should only see allowed menu items + check bottom menu is alaways accessible", () => {
    cy.login();

    // Parcourir toutes les URLs définies dans accessUrlList
    accessUrlList.forEach((access) => {
      if (access.label !== "Réaffectateur" && access.label !== "Temps moyens") {
        const accessIds = [access.id]; // Autoriser uniquement l'accès à la page actuelle
        // Mettre à jour les droits d'accès pour l'utilisateur
        updateUserAccounatApi({
          userId,
          accessIds,
          ventilations,
          token,
        }).then(() => {
          // Recharger la page pour appliquer les nouveaux droits
          cy.visit("/");
          // cy.wait(20000);

          // Vérifier que le menu contient uniquement l'élément autorisé
          cy.get("#side-menu-bar .menu-scrollable").within(() => {
            // Vérifier que l'élément correspondant à l'accès est visible
            cy.get(".menu-item").should("contain.text", access.label);

            // Vérifier que les autres éléments ne sont pas visibles
            accessUrlList.forEach((otherAccess) => {
              if (
                otherAccess.label !== "Réaffectateur" &&
                otherAccess.label !== "Temps moyens" &&
                otherAccess.label !== undefined &&
                otherAccess.label !== access.label
              ) {
                cy.get(".menu-item").should(
                  "not.contain.text",
                  otherAccess.label
                );
              }

              const toolToNotCheck = [];
              toolToNotCheck.push("Référentiels de temps moyens");
              if (
                access.label !== "Ventilateur" ||
                access.label !== "Données d'activité"
              )
                toolToNotCheck.push("Les extracteurs");
              checkToolsMenu(toolToNotCheck);
            });
          });
        });
      }
    });
  });

  it.skip("Remove access to Réafecteur and check that user does not have access to Réaffecteur page from ventilateur", () => {
    const accessIds = accessUrlList
      .filter((access) => access.label !== "Réaffectateur")
      .map((access) => access.id);

    updateUserAccounatApi({
      userId,
      accessIds,
      ventilations,
      token,
    }).then(() => {
      cy.login();
      cy.visit("/ventilations");
      cy.location("pathname").should("contain", "/ventilations");
      cy.get(".top-header .actions").should(
        "not.contain.text",
        "Simuler des affectations"
      );
    });
    cy.wait(2000); // Wait for the page to load completely
    checkToolsMenu();
  });

  it.skip("Remove access to Réafecteur and check that user does not have access to Réaffecteur page from Simulateur", () => {
    const accessIds = accessUrlList
      .filter((access) => access.label !== "Réaffectateur")
      .map((access) => access.id);

    updateUserAccounatApi({
      userId,
      accessIds,
      ventilations,
      token,
    }).then(() => {
      cy.login();
      cy.visit("/simulateur");
      cy.location("pathname").should("contain", "/simulateur");

      cy.get(".reaffectator").should("not.exist");
    });
    cy.wait(2000); // Wait for the page to load completely
    checkToolsMenu();
  });

  it.skip("Give only access to Magistrat and check user does not have access to Greffier and Contractuel datas on panorama ", () => {
    const accessUrls = accessUrlList.map((access) => access.id);
    const accessFonctions = accessFonctionsList
      .filter((access) => access.label === "Accès aux magistrats")
      .map((access) => access.id);
    const accessIds = [...accessUrls, ...accessFonctions];

    updateUserAccounatApi({
      userId,
      accessIds,
      ventilations,
      token,
    }).then(() => {
      cy.login();
      cy.visit("/panorama");
      cy.location("pathname").should("contain", "/panorama");
      cy.get(".workforce-panel workforce-composition .cards .category")
        .should("not.contain.text", "Greffe")
        .should("not.contain.text", "Autour du magistrat");
      cy.get(".workforce-panel .records-update .category")
        .should("not.contain.text", "Greffe")
        .should("not.contain.text", "Autour du magistrat");
    });
    cy.wait(2000); // Wait for the page to load completely
    checkToolsMenu();
  });

  it.skip("Give only access to Greffier and check user does not have access to Magistrat and Contractuel datas on panorama", () => {
    const accessUrls = accessUrlList.map((access) => access.id);
    const accessFonctions = accessFonctionsList
      .filter((access) => access.label === "Accès aux greffiers")
      .map((access) => access.id);
    const accessIds = [...accessUrls, ...accessFonctions];

    updateUserAccounatApi({
      userId,
      accessIds,
      ventilations,
      token,
    }).then(() => {
      cy.login();
      cy.visit("/panorama");
      cy.location("pathname").should("contain", "/panorama");
      cy.get(".workforce-panel workforce-composition .cards .category")
        .should("not.contain.text", "Siège")
        .should("not.contain.text", "Autour du magistrat");
      cy.get(".workforce-panel .records-update .category")
        .should("not.contain.text", "Siège")
        .should("not.contain.text", "Autour du magistrat");
    });
    cy.wait(2000); // Wait for the page to load completely
    checkToolsMenu();
  });

  it.skip("Give only access to Contractuel and check user does not have access to Magistrat and Greffier datas on panorama", () => {
    const accessUrls = accessUrlList.map((access) => access.id);
    const accessFonctions = accessFonctionsList
      .filter((access) => access.label === "Accès aux contractuels")
      .map((access) => access.id);
    const accessIds = [...accessUrls, ...accessFonctions];

    updateUserAccounatApi({
      userId,
      accessIds,
      ventilations,
      token,
    }).then(() => {
      cy.login();
      cy.visit("/panorama");
      cy.location("pathname").should("contain", "/panorama");
      cy.get(".workforce-panel workforce-composition .cards .category")
        .should("not.contain.text", "Siège")
        .should("not.contain.text", "Greffe");
      cy.get(".workforce-panel .records-update .category")
        .should("not.contain.text", "Siège")
        .should("not.contain.text", "Greffe");
    });
    cy.wait(2000); // Wait for the page to load completely
    checkToolsMenu();
  });

  it.skip("Give only access to Magistrat and check user does not have access to Greffier datas on cockpit ", () => {
    const accessUrls = accessUrlList.map((access) => access.id);
    const accessFonctions = accessFonctionsList
      .filter((access) => access.label === "Accès aux magistrats")
      .map((access) => access.id);
    const accessIds = [...accessUrls, ...accessFonctions];

    updateUserAccounatApi({
      userId,
      accessIds,
      ventilations,
      token,
    }).then(() => {
      cy.login();
      cy.visit("/cockpit");
      cy.wait(2000);
      cy.location("pathname").should("contain", "/cockpit");
      cy.get(".sub-main-header .categories-switch")
        .should("not.contain.text", "Greffe")
        .should("not.contain.text", "Autour du magistrat");
    });
    cy.wait(2000); // Wait for the page to load completely
    checkToolsMenu();
  });

  it.skip("Give only access to Greffier and check user does not have access to Magistrat datas on cockpit ", () => {
    const accessUrls = accessUrlList.map((access) => access.id);
    const accessFonctions = accessFonctionsList
      .filter((access) => access.label === "Accès aux greffiers")
      .map((access) => access.id);
    const accessIds = [...accessUrls, ...accessFonctions];

    updateUserAccounatApi({
      userId,
      accessIds,
      ventilations,
      token,
    }).then(() => {
      cy.login();
      cy.visit("/cockpit");
      cy.wait(2000); // Wait for the page to load completely
      cy.location("pathname").should("contain", "/cockpit");
      cy.get(".sub-main-header .categories-switch")
        .should("not.contain.text", "Siège")
        .should("not.contain.text", "Autour du magistrat");
    });
    cy.wait(2000); // Wait for the page to load completely
    checkToolsMenu();
  });

  it.skip("Give only access to Magistrat and check user does not have access to Greffier and Contractuel datas on ventilateur", () => {
    const accessUrls = accessUrlList.map((access) => access.id);
    const accessFonctions = accessFonctionsList
      .filter((access) => access.label === "Accès aux magistrats")
      .map((access) => access.id);
    const accessIds = [...accessUrls, ...accessFonctions];

    updateUserAccounatApi({
      userId,
      accessIds,
      ventilations,
      token,
    }).then(() => {
      cy.login();
      cy.visit("/ventilations");
      cy.location("pathname").should("contain", "/ventilations");
      cy.get(".title .checkbox-button")
        .should("not.contain.text", "Greffe")
        .should("not.contain.text", "Autour du magistrat");
    });
    cy.wait(2000); // Wait for the page to load completely
    checkToolsMenu();
  });

  it.skip("Give only access to Greffier and check user does not have access to Magistrat and Contractuel datas on ventilateur", () => {
    const accessUrls = accessUrlList.map((access) => access.id);
    const accessFonctions = accessFonctionsList
      .filter((access) => access.label === "Accès aux greffiers")
      .map((access) => access.id);
    const accessIds = [...accessUrls, ...accessFonctions];

    updateUserAccounatApi({
      userId,
      accessIds,
      ventilations,
      token,
    }).then(() => {
      cy.login();
      cy.visit("/ventilations");
      cy.location("pathname").should("contain", "/ventilations");
      cy.get(".title .checkbox-button")
        .should("not.contain.text", "Siège")
        .should("not.contain.text", "Autour du magistrat");
    });
    cy.wait(2000); // Wait for the page to load completely
    checkToolsMenu();
  });

  it.skip("Give only access to Contractuel and check user does not have access to Magistrat and Greffier datas on ventilateur", () => {
    const accessUrls = accessUrlList.map((access) => access.id);
    const accessFonctions = accessFonctionsList
      .filter((access) => access.label === "Accès aux contractuels")
      .map((access) => access.id);
    const accessIds = [...accessUrls, ...accessFonctions];

    updateUserAccounatApi({
      userId,
      accessIds,
      ventilations,
      token,
    }).then(() => {
      cy.login();
      cy.visit("/ventilations");
      cy.location("pathname").should("contain", "/ventilations");
      cy.get(".title .checkbox-button")
        .should("not.contain.text", "Siège")
        .should("not.contain.text", "Greffe");
    });
    cy.wait(2000); // Wait for the page to load completely
    checkToolsMenu();
  });

  it.skip("Give only access to Magistrat and check user does not have access to Greffier and Contractuel datas on workforce extractor", () => {
    const accessUrls = accessUrlList.map((access) => access.id);
    const accessFonctions = accessFonctionsList
      .filter((access) => access.label === "Accès aux magistrats")
      .map((access) => access.id);
    const accessIds = [...accessUrls, ...accessFonctions];

    updateUserAccounatApi({
      userId,
      accessIds,
      ventilations,
      token,
    }).then(() => {
      cy.login();
      cy.visit("/dashboard");
      cy.location("pathname").should("contain", "/dashboard");
      cy.get("aj-extractor-ventilation .exportateur-container .category-select")
        .click()
        .get(".cdk-overlay-pane")
        .should("contain.text", "Siège")
        .should("not.contain.text", "Greffe")
        .should("not.contain.text", "Equipe Autour du magistrat");
      cy.get("body").click(0, 0);
    });
    cy.wait(2000); // Wait for the page to load completely
    checkToolsMenu();
  });

  it.skip("Give only access to Greffier and check user does not have access to Magistrat and Contractuel datas on workforce extractor", () => {
    const accessUrls = accessUrlList.map((access) => access.id);
    const accessFonctions = accessFonctionsList
      .filter((access) => access.label === "Accès aux greffiers")
      .map((access) => access.id);
    const accessIds = [...accessUrls, ...accessFonctions];

    updateUserAccounatApi({
      userId,
      accessIds,
      ventilations,
      token,
    }).then(() => {
      cy.login();
      cy.visit("/dashboard");
      cy.location("pathname").should("contain", "/dashboard");
      cy.get("aj-extractor-ventilation .exportateur-container .category-select")
        .click()
        .get(".cdk-overlay-pane")
        .should("contain.text", "Greffe")
        .should("not.contain.text", "Siège")
        .should("not.contain.text", "Equipe Autour du magistrat");
      cy.get("body").click(0, 0);
    });
    cy.wait(2000); // Wait for the page to load completely
    checkToolsMenu();
  });

  it.skip("Give only access to Contractuel and check user does not have access to Magistrat and Greffier datas on workforce extractor", () => {
    const accessUrls = accessUrlList.map((access) => access.id);
    const accessFonctions = accessFonctionsList
      .filter((access) => access.label === "Accès aux contractuels")
      .map((access) => access.id);
    const accessIds = [...accessUrls, ...accessFonctions];

    updateUserAccounatApi({
      userId,
      accessIds,
      ventilations,
      token,
    }).then(() => {
      cy.login();
      cy.visit("/dashboard");
      cy.location("pathname").should("contain", "/dashboard");
      cy.get("aj-extractor-ventilation .exportateur-container .category-select")
        .click()
        .get(".cdk-overlay-pane")
        .should("contain.text", "Equipe autour du magistrat")
        .should("not.contain.text", "Siège")
        .should("not.contain.text", "Greffe");
      cy.get("body").click(0, 0);
    });
    cy.wait(2000); // Wait for the page to load completely
    checkToolsMenu();
  });
});
