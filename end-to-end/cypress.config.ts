import { defineConfig } from "cypress";
import { verifyDownloadTasks } from "cy-verify-downloads";

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
    },
    baseUrl: process.env.CYPRESS_BASE_URL
      ? process.env.CYPRESS_BASE_URL
      : "http://localhost:4200",
    supportFile: "support/e2e.ts",
    video: true,
    videosFolder: "cypress/videos",
    downloadsFolder: "e2e/cypress/downloads",
    defaultCommandTimeout: 10000,
  },
});
