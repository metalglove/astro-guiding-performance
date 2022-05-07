<template>
  <div class="uploader">
    <FileUploader @logsUploaded="startProcessing" v-if="!filesUploaded"/>
    <GuidingPerformance v-if="filesUploaded" :logs="localLogs" />
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, ref } from 'vue';
import { useAppStore } from '../store';
import { AppGetterTypes } from '../store/modules/App/App.getters';
import { AppActionTypes } from '../store/modules/App/App.actions';
import FileUploader from '../components/File/FileUploader.vue';
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
    const store = useAppStore();
    const filesUploaded = computed(() => store.getters(AppGetterTypes.GET_FILES_UPLOADED));

    const localLogs = ref({});

    const startProcessing = (logs: { AutorunLog: AutorunLog, PHDLog: PHDLog }) => {
      localLogs.value = logs;
      store.dispatch(AppActionTypes.SET_FILES_UPLOADED, true);
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
