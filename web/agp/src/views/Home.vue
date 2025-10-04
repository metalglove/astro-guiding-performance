<template>
  <div class="uploader">
    <FileUploader v-if="!filesUploaded"/>
    <GuidingPerformance v-if="filesUploaded" />
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, ref } from 'vue';
import { useAppStore } from '../store';
import { AppGetterTypes } from '../store/modules/App/App.getters';
import FileUploader from '../components/File/FileUploader.vue';
import GuidingPerformance from '../components/GuidingPerformance.vue';

export default defineComponent({
  name: 'Home',
  components: {
    FileUploader,
    GuidingPerformance,
  },
  setup(props, { emit }) {
    const store = useAppStore();
    const filesUploaded = computed(() => store.getters(AppGetterTypes.GET_FILES_UPLOADED));

    return {
      filesUploaded,
    };
  },
});
</script>

<style scoped>
.uploader {
  min-height: 60vh;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
