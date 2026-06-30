import { defineConfig } from "vite";

export default defineConfig({
  build: {
    lib: {
      entry: "src/index.ts",
      name: "ReactiveGraph",
      fileName: (format) => `reactive-graph.${format}.js`
    },
    rollupOptions: {
      // do NOT bundle dependencies (you have none anyway)
      external: []
    }
  }
});