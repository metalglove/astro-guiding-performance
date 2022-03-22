<template>
  <div class="uploader">
    <FileUploader @logsUploaded="startProcessing" v-if="!filesUploaded"/>
    <GuidingPerformance v-if="filesUploaded" :logs="localLogs" />
  </div>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue';
import FileUploader from '../components/FileUploader.vue';
import GuidingPerformance from '../components/GuidingPerformance.vue';
import { AutorunLog } from '../utilities/AutorunLog';
import { PHDLog } from '../utilities/PHDLog';

export default defineComponent({
  name: 'Home',
  components: {
    FileUploader,
    GuidingPerformance,
  },
  setup(props, { emit }) {
    const filesUploaded = ref(false);
    const localLogs = ref({});
    const startProcessing = (logs: { AutorunLog: AutorunLog, PHDLog: PHDLog }) => {
      localLogs.value = logs;
      filesUploaded.value = true;
    };

    return {
      startProcessing,
      filesUploaded,
      localLogs,
    };
  },
});
</script>

<style scoped>
.home {
  color: black;
}
</style>
