import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'
import defaults from './defaults'
import { icons } from './icons'
import 'vuetify/styles'

// vite-plugin-vuetify автоматически импортирует стили
// Но можно также импортировать явно, если нужно
// import 'vuetify/styles'

export default createVuetify({
  components,
  directives,
  icons,
})
