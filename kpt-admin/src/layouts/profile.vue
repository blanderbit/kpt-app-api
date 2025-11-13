<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

const drawer = ref(true)

type MenuItem = {
  title: string
  icon: string
  route: string
}

type MenuSection = {
  title: string
  icon: string
  description?: string
  items: MenuItem[]
}

const createSection = (section: MenuSection): MenuSection => ({
  ...section,
  items: [...section.items].sort((a, b) => a.title.localeCompare(b.title)),
})

const menuSections: MenuSection[] = [
  createSection({
    title: 'Management',
    icon: 'mdi-briefcase-outline',
    items: [
      { title: 'Activity Types', icon: 'mdi-run', route: '/profile/activity-types' },
      { title: 'Articles', icon: 'mdi-file-document-outline', route: '/profile/articles' },
      { title: 'Clients', icon: 'mdi-account-group', route: '/profile/clients' },
      { title: 'Mood Surveys', icon: 'mdi-clipboard-text', route: '/profile/mood-surveys' },
      { title: 'Mood Types', icon: 'mdi-emoticon-happy', route: '/profile/mood-types' },
      { title: 'Notifications', icon: 'mdi-bell-outline', route: '/profile/notifications' },
      { title: 'Onboarding Questions', icon: 'mdi-help-circle', route: '/profile/onboarding-questions' },
      { title: 'Subscriptions', icon: 'mdi-receipt', route: '/profile/subscriptions' },
      { title: 'Social Networks', icon: 'mdi-share-variant', route: '/profile/social-networks' },
      { title: 'Surveys', icon: 'mdi-clipboard-text', route: '/profile/surveys' },
      { title: 'Tooltips', icon: 'mdi-tooltip-text', route: '/profile/tooltips' },
      { title: 'Users Stats', icon: 'mdi-chart-line', route: '/profile/users-stats' },
    ],
  }),
  createSection({
    title: 'Technical',
    icon: 'mdi-alert-circle-outline',
    description: 'Use with caution',
    items: [
      { title: 'Admins', icon: 'mdi-shield-account', route: '/profile/admins' },
      { title: 'Backup', icon: 'mdi-backup-restore', route: '/profile/backup' },
      { title: 'Languages', icon: 'mdi-translate', route: '/profile/languages' },
      { title: 'Queue', icon: 'mdi-format-list-bulleted', route: '/profile/queue' },
      { title: 'Settings', icon: 'mdi-cog', route: '/profile/settings' },
    ],
  }),
]

const handleLogout = () => {
  window.localStorage.removeItem('auth_token')
  router.push('/login')
}
</script>

<template>
  <v-app>
    <v-navigation-drawer
      v-model="drawer"
      permanent
      width="280"
      color="surface"
      class="d-flex flex-column"
    >
      <v-sheet class="d-flex flex-column flex-grow-1" color="transparent">
        <div class="flex-grow-1">
          <v-list>
            <v-list-item
              prepend-icon="mdi-view-dashboard"
              title="KPT Admin"
              subtitle="Admin Panel"
            ></v-list-item>
          </v-list>

          <v-divider></v-divider>

          <div class="drawer-sections px-3 pb-3 pt-2">
            <section
              v-for="section in menuSections"
              :key="section.title"
              class="drawer-section"
            >
              <v-list-subheader class="text-uppercase text-caption font-weight-bold d-flex align-center">
                <v-icon size="small" class="mr-2">{{ section.icon }}</v-icon>
                <span>{{ section.title }}</span>
                <span v-if="section.description" class="ml-2 text-caption font-italic">
                  ({{ section.description }})
                </span>
              </v-list-subheader>

              <v-list density="compact" nav>
                <v-list-item
                  v-for="item in section.items"
                  :key="item.route"
                  :prepend-icon="item.icon"
                  :title="item.title"
                  :value="item.route"
                  :to="item.route"
                ></v-list-item>
              </v-list>
            </section>
          </div>
        </div>

        <v-divider></v-divider>

        <v-list class="pt-0">
          <v-list-item
            prepend-icon="mdi-logout"
            title="Logout"
            class="logout-item"
            @click="handleLogout"
          ></v-list-item>
        </v-list>
      </v-sheet>
    </v-navigation-drawer>

    <v-app-bar color="primary" density="compact">
      <v-app-bar-nav-icon @click="drawer = !drawer"></v-app-bar-nav-icon>
      <v-toolbar-title>KPT Admin</v-toolbar-title>
      <v-spacer></v-spacer>
      <v-btn icon="mdi-account-circle"></v-btn>
    </v-app-bar>

    <v-main class="main-scrollable">
      <RouterView />
    </v-main>
  </v-app>
</template>

<style>
.v-navigation-drawer .v-sheet {
  display: flex;
  flex-direction: column;
  height: 100%;
}

 .v-list-item {
  cursor: pointer;
}

.drawer-menu,
.drawer-sections {
  flex: 1 1 auto;
  overflow-y: auto;
}

.drawer-section {
  padding-top: 8px;
  padding-bottom: 4px;
}

.logout-item {
  position: sticky;
  bottom: 0;
  background-color: inherit;
}
.drawer-section + .drawer-section {
  margin-top: 12px;
}
.v-main.main-scrollable {
  max-height: calc(100vh - 48px);
  overflow-y: auto;
}

</style>

