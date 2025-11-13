<template>
  <div class="spiner-wrapper" v-if="loading" :class="[
    type === 'global'
      ? 'spiner-wrapper__page'
      : 'spiner-wrapper__local'
  ]">
   <img :src="Loader" alt="Loader">
  </div>
</template>

<script setup lang="ts">
import { ref, watch, getCurrentInstance, onBeforeUnmount } from 'vue'
import Loader from './loader.svg'
import { LoaderManagerInstance } from './index';
const props = withDefaults(defineProps<{
  isLoading?: boolean,
  type: string,
  name: string,
}>(), {
  type: 'local',
  isLoading: false,
  name: ''
});

const loading = ref(props.isLoading);
if (props.name) {
  LoaderManagerInstance.registerLoaderInstance(props.name, getCurrentInstance());
}

onBeforeUnmount(() => {
  LoaderManagerInstance.unRegisterLoaderInstance(props.name)
});

watch(
  () => props.isLoading,
  (newData) => {

    loading.value = newData;
  }
);

</script>

<style lang="scss" scoped>
@use "@styles/mixins" as *;

.spiner-wrapper {
  background: rgb(172 173 174 / 45%);
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 1000000;
  @include flexFullCenter;

  img {
    width: 220px;
    height: 248px;
  }

  &.spiner-wrapper__page {
    position: fixed;
  }

  &.spiner-wrapper__local {
    position: absolute;

    img {
      width: 80px;
      height: 100px;
    }
  }

}
</style>