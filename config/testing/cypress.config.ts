import { defineConfig } from "cypress";

export default defineConfig({
  e2e: {
    baseUrl: "http://localhost:3000",
    setupNodeEvents(on, config) {
      // The Percy healthcheck task is no longer required
      // and was causing the error.
      // It is handled automatically by the plugin.
      return config;
    },
  },
});
