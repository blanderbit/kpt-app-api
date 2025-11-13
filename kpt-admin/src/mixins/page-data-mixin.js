// Mixin for loading page data from resolver
export const pageDataMixin = {
  async created() {
    // Load data from resolver
    if (this.$route.meta.pageData) {
      try {
        const data = await this.$route.meta.pageData
        this.loadPageData(data)
      } catch (error) {
        console.error('Error loading page data:', error)
      }
    }
  },
  methods: {
    loadPageData(data) {
      // Override this method in components to handle specific data loading
      console.log('Page data loaded:', data)
    }
  }
}
