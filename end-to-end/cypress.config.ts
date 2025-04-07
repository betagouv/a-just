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
        logDownloads() {
          const downloadPath = path.resolve(
            __dirname,
            "..",
            "e2e/cypress/downloads"
          );
          if (fs.existsSync(downloadPath)) {
            const files = fs.readdirSync(downloadPath);
            console.log(
              "📥 Fichiers dans le dossier de téléchargement :",
              files
            );
          } else {
            console.log(
              "❌ Dossier de téléchargement introuvable :",
              downloadPath
            );
          }
          return null;
        },
        ...verifyDownloadTasks,
      });
    },
    baseUrl: process.env.CYPRESS_BASE_URL
      ? process.env.CYPRESS_BASE_URL
      : "http://localhost:4200",
    supportFile: "support/e2e.ts",
    video: true,
    videosFolder: "cypress/videos",
    downloadsFolder: "cypress/downloads",
    defaultCommandTimeout: 10000,
  },
});
