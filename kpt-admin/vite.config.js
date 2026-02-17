import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vuetify from 'vite-plugin-vuetify'
import Pages from 'vite-plugin-pages'
import Layouts from 'vite-plugin-vue-layouts'
import { resolve } from 'path'
import { fileURLToPath } from "node:url";

console.log(fileURLToPath(
  new URL("packages/ui-kit/styles/mixins/", import.meta.url)
))
export default defineConfig({
  base: '/',
  plugins: [
    vue(),
    vuetify({ autoImport: true }),
    Pages({
      dirs: 'src/pages',
      exclude: ['**/components/**'],
      extensions: ['vue'],
      // extendRoute(route, parent) {
      //   // Add meta information to routes
      //   if (route.path === '/') {
      //     route.redirect = '/profile/clients'
      //   }
      //   if (route.path === '/profile') {
      //     route.redirect = '/profile/clients'
      //   }
      //   return route
      // }
    }),
    Layouts({
      layoutsDirs: 'src/layouts',
      defaultLayout: 'default'
    })
  ],
  envPrefix: ['VITE_', 'VUE_APP_'],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '@styles/mixins': fileURLToPath(
        new URL("packages/ui-kit/styles/mixins/", import.meta.url)
      ),
      '@styles': fileURLToPath(
        new URL("packages/ui-kit/styles/", import.meta.url)
      ),
      '@api': fileURLToPath(
        new URL("packages/api/", import.meta.url)
      ),
      '@workers': fileURLToPath(
        new URL("packages/workers/", import.meta.url)
      ),
      '~': resolve(__dirname, 'src')
    }
  },
  server: {
    port: 8085,
    host: '0.0.0.0',
    watch: {
      usePolling: true
    },
    hmr: {
      host: 'localhost',
      port: 8085,
      clientPort: 8085
    }
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['vue', 'vue-router', 'vuetify'],
          mdi: ['@mdi/font/css/materialdesignicons.css']
        }
      }
    }
  }
})
