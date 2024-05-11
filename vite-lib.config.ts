import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'
import stringHash from 'string-hash'
export default defineConfig({
  plugins: [vue()],
  build: {
    minify: false,
    sourcemap: false,
    lib: {
      entry: path.resolve(__dirname, './src/index.ts'),
      name: 'erp-ui'
    },
    cssCodeSplit: true,
    cssMinify: true,
    rollupOptions: {
       // 请确保外部化那些你的库中不需要的依赖
       external: [
        'vue',
        'element-plus'
      ],
      output: {
        // 在 UMD 构建模式下为这些外部化的依赖提供一个全局变量
        globals: {
          vue: 'Vue',
          'element-plus': 'element-plus'
        }
      }
    }
  },
  css: {
    modules: {
      generateScopedName: (name, filename, css) => {
        const f = filename.split('?')[0].split('.')[0]
        const file = path.basename(f)
        const hash = stringHash(css).toString(36).substr(0, 5);
        return `${file}_${name}_${hash}`
      }
    }
  }
})
