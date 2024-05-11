import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from "path";
export default defineConfig({
  resolve: {
    alias: [{ find: "@", replacement: path.resolve(__dirname, "./example") }],
    extensions: [".mjs", ".js", ".ts", ".jsx", ".tsx", ".json", ".vue"]
  },
  plugins: [vue()],
  server: {
    port: 3001
  }
})
