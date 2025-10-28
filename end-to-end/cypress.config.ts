import { defineConfig } from "cypress";
import { verifyDownloadTasks } from "cy-verify-downloads";
import path from "path";
import fs from "fs";

const jsonOnly = process.env.CY_JSON_ONLY === "1";

export default defineConfig({
  // Reporter must be top-level in Cypress >=10
  reporter: "cypress-mochawesome-reporter",
  reporterOptions: (process.env.CY_JSON_ONLY === "1")
    ? {
        reportDir: "cypress/reports",
        reportFilename: "e2e",
        overwrite: false,
        html: false,
        json: true,
        keepJson: true,
        embeddedScreenshots: true,
        inlineAssets: true,
        saveAllAttempts: false,
        generateReport: false,
        quiet: false,
      }
    : {
        charts: true,
        reportPageTitle: "A-JUST E2E Tests Report",
        embeddedScreenshots: true,
        inlineAssets: true,
        saveAllAttempts: false,
        reportDir: "cypress/reports",
        reportFilename: "report",
        overwrite: false,
        html: false,
        json: true,
        keepJson: true,
        timestamp: "mmddyyyy_HHMMss",
        generateReport: false,
        quiet: false,
      },
  component: {
    devServer: {
      framework: "angular",
      bundler: "webpack",
    },
    specPattern: "**/*.cy.ts",
  },
  e2e: {
    testIsolation: false,
    setupNodeEvents(on, config) {
      // implement node event listeners here
      on("task", verifyDownloadTasks);
      // Load cypress-mochawesome-reporter plugin only when not in JSON-only mode
      if (!jsonOnly) {
        require("cypress-mochawesome-reporter/plugin")(on);
      }
    },
    baseUrl: process.env.CYPRESS_BASE_URL
      ? process.env.CYPRESS_BASE_URL
      : "http://localhost:4200",
    // Always load support to keep custom commands (e.g., cy.login)
    supportFile: "support/e2e.ts",
    video: true,
    videosFolder: "cypress/videos",
    downloadsFolder: "cypress/downloads",
    defaultCommandTimeout: 10000,
    env: {
      NG_APP_SERVER_URL:
        process.env.NG_APP_SERVER_URL || "http://localhost:8081/api",
    },
  },
})
;
