<route lang="yaml">
meta:
  layout: default
</route>

<template>
  <v-container fluid>
    <v-row>
      <v-col cols="12">
        <v-card>
          <v-card-title>
            <v-icon left>mdi-view-dashboard</v-icon>
            Dashboard
          </v-card-title>
          <v-card-text>
            <v-row>
              <v-col cols="12" md="3" v-for="stat in stats" :key="stat.title">
                <v-card class="text-center" color="primary" dark>
                  <v-card-text>
                    <div class="text-h4">{{ stat.value }}</div>
                    <div>{{ stat.title }}</div>
                  </v-card-text>
                </v-card>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
export default {
  name: 'DashboardPage',
  data() {
    return {
      stats: []
    }
  },
  async created() {
    // Load data from resolver
    if (this.$route.meta.pageData) {
      const data = await this.$route.meta.pageData
      this.stats = data.stats || []
    }
  }
}
</script>
