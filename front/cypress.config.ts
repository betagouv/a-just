import { defineConfig } from "cypress";
const { verifyDownloadTasks } = require('cy-verify-downloads');

export default defineConfig({
  e2e: {
    testIsolation: false,
    setupNodeEvents(on, config) {
      // implement node event listeners here
      on('task', verifyDownloadTasks);
    },
    baseUrl: process.env.FRONT_URL || 'http://localhost:4200',

  },
});
