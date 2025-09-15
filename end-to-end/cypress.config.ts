import { defineConfig } from "cypress";
import { verifyDownloadTasks } from "cy-verify-downloads";
import path from "path";
import fs from "fs";

export default defineConfig({
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
      // Configuration pour mochawesome reporter
      require("cypress-mochawesome-reporter/plugin")(on);
    },
    baseUrl: process.env.CYPRESS_BASE_URL
      ? process.env.CYPRESS_BASE_URL
      : "http://localhost:4200",
    supportFile: "support/e2e.ts",
    video: true,
    videosFolder: "cypress/videos",
    downloadsFolder: "cypress/downloads",
    defaultCommandTimeout: 10000,
    // Configuration du reporter
    reporter: "cypress-mochawesome-reporter",
    reporterOptions: {
      charts: true,
      reportPageTitle: "A-JUST E2E Tests Report",
      embeddedScreenshots: true,
      inlineAssets: true,
      saveAllAttempts: false,
      reportDir: "cypress/reports",
      reportFilename: "report",
      overwrite: false,
      html: true,
      json: true,
      timestamp: "mmddyyyy_HHMMss",
      // Force la génération du fichier JSON
      generateReport: true,
      quiet: false,
    },
    env: {
      NG_APP_SERVER_URL:
        process.env.NG_APP_SERVER_URL || "http://localhost:8081/api",
    },
  },
});
