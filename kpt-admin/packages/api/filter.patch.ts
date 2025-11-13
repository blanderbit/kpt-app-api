import { watch, ref, computed } from 'vue';
import { cloneDeep, isEqual } from 'lodash';
const $updateQuery = (queryConfig) => {
  const { router } = queryConfig;
  return (query) => {
    query = Object.keys(query)
      .filter((item) => !!(query[item] !== undefined && query[item] !== null)) //
      .reduce(
        (prev, cur) => ({
          ...prev,
          [cur]: query[cur],
        }),
        {}
      );
    return router
      .replace({
        path: router.currentRoute.value.path,
        query,
      })
      .catch((err) => err);
  };
};

const filterParseFromUrl = (config, query) => {
  Object.keys(config).forEach((key) => {
    if (config[key] && query[key]) {
      config[key].value = query[key];
    }
  });
  return config;
};

const getValuesFromFilter = (values) => {
  return Object.keys(values)
    .filter(i => {
      return !!(values[i]?.value !== undefined && values[i]?.value !== null)
    })
    .reduce((acc, cur) => {
      return {
        ...acc,
        [cur]: values[cur]?.value,
      };
    }, {});
};

const FilterPatch = (config) => {
  const {
    filters: filtersConfig,
    afterUpdateFiltersCallBack,
    router,
    transpilledQuery,
    disableQueryUpdate,
  } = config;
  const filters = ref(
    filterParseFromUrl(
      filtersConfig,
      router.currentRoute.value.meta.transpilledQuery || transpilledQuery || {}
    )
  );

  const updateQuery = $updateQuery(config);

  const updateFilter = () => {
    if (typeof afterUpdateFiltersCallBack === 'function') {
      afterUpdateFiltersCallBack();
    }
    if (disableQueryUpdate) return;
    updateQuery(getValuesFromFilter(filters.value));
  };

  const setFilters = (value) => {
    filterParseFromUrl(filters.value, value);
  };

  const clearFilters = () => {
    Object.keys(filters.value).forEach(
      (key) => (filters.value[key].value = filters.value[key].default)
    );
  };
  const checkFilterValidation = computed(() => {
    return Object.keys(filters.value).every(
      (key) => filters.value[key].validation
        ? filters.value[key].validation(filters.value[key], filters.value)
        : true
    );
  });

  watch(
    () => cloneDeep(getValuesFromFilter(filters.value)),
    (a, b) => {
      if (!isEqual(a, b)) {
        updateFilter();
      }
    },
    {
      deep: true,
      immediate: false,
    }
  );

  return {
    updateFilter,
    filters,
    setFilters,
    clearFilters,
    getRawFilters: () => getValuesFromFilter(filters.value),
    checkFilterValidation
  };
};

export { FilterPatch };
