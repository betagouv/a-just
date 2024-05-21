import { defineConfig } from "cypress";
import { environment } from "src/environments/environment";

export default defineConfig({
  e2e: {
    setupNodeEvents(on, config) {
      // implement node event listeners here
    },
    baseUrl: process.env.FRONT_URL || 'http://localhost:4200',
  },
});
