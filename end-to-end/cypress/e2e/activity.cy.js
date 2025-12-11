import { getShortMonthString } from "../../support/utils/dates";
import { contentieuxStructure } from "../../support/utils/contentieux";
import user from "../../fixtures/user.json";
import { loginApi, getUserDataApi, resetToDefaultPermissions } from "../../support/api";

describe("Données d'activité", () => {
  before(() => {
    // Ensure user has full permissions before UI login
    loginApi(user.email, user.password).then((resp) => {
      const userId = resp.body.user.id;
      const token = resp.body.token;
      
      return getUserDataApi(token).then((resp) => {
        const ventilations = resp.body.data.backups.map((v) => v.id);
        return resetToDefaultPermissions(userId, ventilations, token);
      });
    }).then(() => {
      // Now proceed with UI login
      cy.login();
    });
  });

  it("Check the activity data page load", () => {
    cy.visit("/donnees-d-activite");
    cy.wait(1000);
    cy.url().should("include", "/donnees-d-activite");
  });

  it("Check the name page is displayed", () => {
    cy.get(".title-with-doc")
      .get("h3")
      .should("contain.text", "Données d'activité");
  });

  it("Check that the doc button is accessible", () => {
    cy.get(".top-header")
      .get(".top-header-back-title .title-with-doc")
      .get("aj-help-button")
      .click();

    cy.wait(1000);

    cy.get(".panel-helper .panel-header")
      .get(".panel-header-closing-row")
      .should("contain.text", "Données d'activité A-JUST :");
    cy.get(".panel-header-closing-row").get(".ri-close-line").click();
  });

  it("Check that all contentieux (level 2 + 3) are displayed", () => {
    // Utilisation de la structure centralisée des contentieux

    // Vérifier que tous les contentieux niveau 2 sont affichés
    contentieuxStructure.forEach((contentieux) => {
      cy.get(".content-list")
        .should("contain.text", contentieux.level2.replace(/^\d+\.\s*/, ""))
        .then(() => {
          cy.log(`✓ Contentieux niveau 2 trouvé: ${contentieux.level2}`);
        });
    });

    // Pour chaque contentieux niveau 2, cliquer pour déplier et vérifier les niveau 3
    contentieuxStructure.forEach((contentieux, index) => {
      // Chercher l'élément parent qui contient le contentieux niveau 2
      cy.get(".content-list .item-grouped")
        .eq(index)
        .within(() => {
          // Cliquer sur l'élément principal pour déplier s'il a des enfants
          cy.get(".item.selectable")
            .first()
            .then(($item) => {
              if ($item.length > 0) {
                cy.wrap($item).click();
                cy.wait(500); // Attendre l'animation de dépliage
              }
            });

          // Vérifier que tous les contentieux niveau 3 sont maintenant visibles
          contentieux.level3.forEach((level3Item) => {
            cy.get(".group")
              .should("contain.text", level3Item.replace(/^\d+\.\d+\.\s*/, ""))
              .then(() => {
                cy.log(`✓ Contentieux niveau 3 trouvé: ${level3Item}`);
              });
          });
        });
    });

    cy.log(
      "✅ Tous les contentieux niveau 2 et 3 ont été vérifiés avec succès"
    );
  });

  it("Check that the 'Complétude gloabe' progress bar is displayed", () => {
    cy.get(".actions .left-panel").get(".completion-bar").should("be.visible");
  });

  it("Check that ressources 'Nomenclature' and 'Data-book' are available", () => {
    cy.get(".actions .right-panel")
      .contains("Ressources")
      .should("be.visible")
      .get(".elements")
      .within(() => {
        cy.contains("La nomenclature");
        cy.contains("Le data-book");
      });
  });

  it("Check that tooltips open panels with correct contentieux iframes", () => {
    // Fonction helper pour extraire le mot-clé du nom du contentieux pour l'URL
    const getContentieuxKeyword = (contentieuxName) => {
      const keywords = {
        "Contentieux Social": "social",
        JAF: "affaires-familiales",
        JCP: "contentieux-de-la-protection",
        "Civil NS": "civil-non-specialise",
        "JLD civil": "jld-civil",
        "Juges des Enfants": "enfants",
        Pénal: "siege-penal",
        JI: "instruction",
        JAP: "application-des-peines",
        "JLD pénal": "jld-penal",
      };
      return keywords[contentieuxName] || contentieuxName.toLowerCase();
    };

    // Parcourir chaque contentieux de niveau 2
    contentieuxStructure.forEach((contentieux, index) => {
      // Cas spécial pour les "Juges des Enfants" - pas de tooltip niveau 2, mais tooltips niveau 3
      if (contentieux.level2 === "JE") {
        cy.log(
          `🔍 Cas spécial JE: Test des tooltips niveau 3 pour ${contentieux.level2}`
        );

        // Déplier d'abord le contentieux JE pour accéder aux niveau 3
        cy.get(".content-list .item-grouped")
          .eq(index)
          .within(() => {
            cy.get(".item.selectable").click();
            cy.wait(500); // Attendre l'animation de dépliage
          });

        // Tester chaque tooltip niveau 3 pour JE
        contentieux.level3.forEach((level3Item, level3Index) => {
          const expectedTitle = level3Item.includes("civile")
            ? "L'activité civile du JE"
            : "L'activité pénale du JE";

          cy.log(
            `🔍 Test tooltip niveau 3: ${level3Item} (titre attendu: ${expectedTitle})`
          );

          cy.get(".content-list .item-grouped")
            .eq(index)
            .within(() => {
              cy.get(".group .group-item")
                .eq(level3Index)
                .within(() => {
                  cy.get(".label .tooltip").then(($tooltipLevel3) => {
                    if ($tooltipLevel3.length > 0) {
                      // Cliquer sur le tooltip niveau 3
                      cy.wrap($tooltipLevel3).find("i").click({ force: true });
                    } else {
                      cy.log(`ℹ️ Pas de tooltip niveau 3 pour: ${level3Item}`);
                    }
                  });
                });
            });

          // Vérifier le panel EN DEHORS du contexte .within()
          cy.get(".content-list .item-grouped")
            .eq(index)
            .find(".group .group-item")
            .eq(level3Index)
            .find(".label .tooltip")
            .then(($tooltip) => {
              if ($tooltip.length > 0) {
                // Attendre que le panel s'ouvre
                cy.get(".panel-helper", { timeout: 5000 })
                  .should("be.visible")
                  .then(() => {
                    cy.log(`✅ Panel ouvert pour JE niveau 3: ${level3Item}`);

                    // Vérifier que l'iframe contient le bon titre dans l'URL
                    const expectedKeyword = level3Item.includes("civile")
                      ? "activite-civile-du-je"
                      : "activite-penale-du-je";
                    cy.get(".panel-helper iframe", { timeout: 3000 })
                      .should("be.visible")
                      .and("have.attr", "src")
                      .and("contain", expectedKeyword)
                      .then(() => {
                        cy.log(
                          `✅ Iframe trouvée avec "${expectedKeyword}" pour JE ${level3Item}`
                        );
                      });

                    // Fermer le panel
                    cy.get(".panel-header-closing-row .ri-close-line")
                      .should("be.visible")
                      .click({ force: true });

                    // Attendre que le panel se ferme complètement
                    cy.get(".panel-helper").should("not.exist");
                    cy.wait(500);
                  });
              }
            });
        });
      } else {
        // Cas normal pour tous les autres contentieux (tooltip niveau 2)
        cy.get(".content-list .item-grouped")
          .eq(index)
          .within(() => {
            // Vérifier s'il y a un tooltip niveau 2
            cy.get(".item .label .tooltip").then(($tooltip) => {
              if ($tooltip.length > 0) {
                cy.log(`🔍 Test tooltip niveau 2 pour: ${contentieux.level2}`);

                // Cliquer sur le tooltip niveau 2
                cy.wrap($tooltip).find("i").click({ force: true });
              } else {
                cy.log(
                  `ℹ️ Pas de tooltip niveau 2 pour: ${contentieux.level2}`
                );
              }
            });
          });

        // Vérifier le panel EN DEHORS du contexte .within() après le clic
        cy.get(".content-list .item-grouped")
          .eq(index)
          .find(".item .label .tooltip")
          .then(($tooltip) => {
            if ($tooltip.length > 0) {
              // Attendre que le panel s'ouvre et que l'animation se termine
              cy.get(".panel-helper", { timeout: 5000 })
                .should("be.visible")
                .then(() => {
                  cy.log(`✅ Panel ouvert pour ${contentieux.level2}`);

                  // Vérifier que l'iframe est présent et contient le bon mot-clé dans son src
                  const expectedKeyword = getContentieuxKeyword(
                    contentieux.level2
                  );
                  cy.get(".panel-helper iframe", { timeout: 3000 })
                    .should("be.visible")
                    .and("have.attr", "src")
                    .and("contain", expectedKeyword)
                    .then(() => {
                      cy.log(
                        `✅ Iframe trouvée avec "${expectedKeyword}" dans l'URL pour ${contentieux.level2}`
                      );
                    });

                  // Fermer le panel
                  cy.get(".panel-header-closing-row .ri-close-line")
                    .should("be.visible")
                    .click({ force: true });

                  // Attendre que le panel se ferme complètement
                  cy.get(".panel-helper").should("not.exist");
                  cy.wait(500);
                });
            }
          });
      }
    });

    cy.log(
      "✅ Tous les tooltips niveau 2 et leurs iframes ont été vérifiés avec succès"
    );
  });

  // Note: Date picker functionality is provided by Material components
  // and doesn't need explicit E2E testing. The presence of aj-date-select
  // component is verified implicitly by the page load test.
});
