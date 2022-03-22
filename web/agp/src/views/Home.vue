<template>
  <div class="uploader">
    <FileUploader @logsUploaded="startProcessing" v-if="!filesUploaded"/>
    <GuidingPerformance v-if="filesUploaded" />
  </div>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue';
import FileUploader from '../components/FileUploader.vue';
import GuidingPerformance from '../components/GuidingPerformance.vue';

export default defineComponent({
  name: 'Home',
  components: {
    FileUploader,
    GuidingPerformance,
  },
  setup(props, { emit }) {
    const filesUploaded = ref(false);
    const startProcessing = (logs: { AutorunLog: string, PHDLog: string }) => {
      filesUploaded.value = true;
    };

    return {
      startProcessing,
      filesUploaded,
    };
  },
});
</script>

<style scoped>
.home {
  color: black;
}
</style>
