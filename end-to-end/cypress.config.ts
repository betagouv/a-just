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
      on("task", {
        saveLabels({ host, labels }: { host: string; labels: string[] }) {
          try {
            const reportsDir = path.join(process.cwd(), "cypress", "reports");
            fs.mkdirSync(reportsDir, { recursive: true });
            const file = path.join(reportsDir, `tj-labels-${host}.json`);
            fs.writeFileSync(file, JSON.stringify(labels, null, 2), "utf8");
            // Also log to console for CI visibility
            // eslint-disable-next-line no-console
            console.log(`[TJ LABELS] ${host}:`, labels);
            return file;
          } catch (e) {
            // eslint-disable-next-line no-console
            console.error("Failed to save labels:", e);
            return null;
          }
        },
      });
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
