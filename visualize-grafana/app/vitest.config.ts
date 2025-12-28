import path from "path";

import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./"),
    },
  },
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "text-summary", "html"],
      include: [
        "utils/**/*.ts",
        "utils/**/*.tsx",
        "components/**/*.ts",
        "components/**/*.tsx",
        "charts/**/*.ts",
        "charts/**/*.tsx",
        "browse/**/*.ts",
        "browse/**/*.tsx",
        "homepage/**/*.ts",
        "homepage/**/*.tsx",
        "rdf/**/*.ts",
        "graphql/**/*.ts",
        "configurator/**/*.ts",
        "configurator/**/*.tsx",
      ],
      exclude: [
        "**/*.spec.ts",
        "**/*.spec.tsx",
        "**/*.test.ts",
        "**/*.test.tsx",
        "**/node_modules/**",
        "**/*.d.ts",
      ],
    },
  },
});
