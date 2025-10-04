<template>
  <div class="uploader">
    <!-- Debug info - remove in production -->
    <div v-if="false" class="debug-info" style="position: fixed; top: 10px; right: 10px; background: rgba(0,0,0,0.8); color: white; padding: 10px; border-radius: 5px; font-size: 12px; z-index: 1000;">
      <div>Files Uploaded: {{ filesUploaded }}</div>
    </div>
    
    <FileUploader v-if="!filesUploaded"/>
    <GuidingPerformance v-else />
  </div>
</template>

<script lang="ts">
import { computed, defineComponent } from 'vue';
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
  setup() {
    const store = useAppStore();
    const filesUploaded = computed(() => {
      const uploaded = store.getters(AppGetterTypes.GET_FILES_UPLOADED);
      console.log('Files uploaded status:', uploaded);
      return uploaded;
    });

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
