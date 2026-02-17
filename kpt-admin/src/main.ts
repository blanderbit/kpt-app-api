import { createApp } from 'vue'
import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import { createHead } from '@unhead/vue'
import { setupLayouts } from 'virtual:generated-layouts'
import App from './App.vue'
import vuetify from './plugins/vuetify'
import routes from '~pages'
import { resolverStore } from './resolvers/page-resolvers'
import '@styles/styles.scss'
import { createGlobalLoader } from '@workers/loading-worker'
import { registerToastPlugin } from '@workers/toast-worker'

const enhancedRoutes = setupLayouts(
  resolverStore.searchRouterForAttachResolverByName(routes as RouteRecordRaw[]),
)

const redirectRoutes: RouteRecordRaw[] = [
  { path: '/profile', redirect: '/profile/clients' },
]

redirectRoutes.reverse().forEach((route) => {
  enhancedRoutes.unshift(route)
})

// Catch-all route для редиректа неизвестных URL на логин
enhancedRoutes.push({
  path: '/:pathMatch(.*)*',
  redirect: '/login',
})

const router = createRouter({
  history: createWebHistory(),
  routes: enhancedRoutes,
})

const PUBLIC_PATHS = ['/login', '/404']
const isPublicPath = (path: string) =>
  PUBLIC_PATHS.includes(path) || path.startsWith('/login')

router.beforeEach((to, _from, next) => {
  if (isPublicPath(to.path)) {
    next()
    return
  }
  const token = typeof localStorage !== 'undefined' ? localStorage.getItem('auth_token') : null
  if (!token) {
    next({ path: '/login', query: { redirect: to.fullPath } })
    return
  }
  next()
})

// Одна попытка перезагрузки при сбое чанка — без цикла (цикл ломал dev и вёл к ERR_CONNECTION_RESET).
let chunkErrorReloadDone = false
router.onError((error, to) => {
  const msg = error?.message ?? ''
  if (
    !chunkErrorReloadDone &&
    (msg.includes('Failed to fetch dynamically imported module') ||
      msg.includes('Importing a module script failed') ||
      msg.includes('error loading dynamically imported module'))
  ) {
    chunkErrorReloadDone = true
    window.location.assign(to.fullPath)
    return
  }
  throw error
})

if (typeof window !== 'undefined') {
  (window as any).router = router
}

createGlobalLoader();

const app = createApp(App)
const head = createHead()

registerToastPlugin(app)

app.use(router)
app.use(vuetify)
app.use(head)

app.mount('#app')

