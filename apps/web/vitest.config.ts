import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["**/__tests__/**/*.test.ts"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
      "@aauti/db": path.resolve(__dirname, "../../packages/db/src/index.ts"),
      "@aauti/types": path.resolve(
        __dirname,
        "../../packages/types/src/index.ts"
      ),
    },
  },
});
