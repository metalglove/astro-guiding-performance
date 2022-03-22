<template>
  <div>
    <h1>Upload log files</h1>
    <div class="main-upload">
      <FileUpload
        fileUploadContainerTitle="Autorun log"
        :logType="Autorun"
        @fileUploaded="onFileUploaded"
      />
    </div>
    <div class="main-upload">
      <FileUpload fileUploadContainerTitle="PHD log" :logType="PHD" @fileUploaded="onFileUploaded"/>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import SpecialLogType from '../utilities/SpecialLogType';
import { AutorunLog } from '../utilities/AutorunLog';
import { PHDLog } from '../utilities/PHDLog';
import FileUpload from './FileUploadComponent.vue';
import AutorunLogReader from '../services/AutorunLogReader';
import PHDLogReader from '../services/PHDLogReader';

export default defineComponent({
  name: 'FileUploader',
  emits: ['logsUploaded'],
  data: () => ({
    Autorun: SpecialLogType.Autorun,
    PHD: SpecialLogType.PHD,
  }),
  components: {
    FileUpload,
  },
  setup(props, { emit }) {
    let autorunLogUploaded = false;
    let phdLogUploaded = false;
    const logs: { AutorunLog: AutorunLog | null, PHDLog: PHDLog | null} = {
      AutorunLog: null,
      PHDLog: null,
    };
    const autorunLogReader: AutorunLogReader = new AutorunLogReader();
    const phdLogReader: PHDLogReader = new PHDLogReader();

    const onFileUploaded = (file: { logType: string, text: string }) => {
      if (file.logType === SpecialLogType.Autorun) {
        const autorunLog: AutorunLog = autorunLogReader.parseText(file.text);
        logs.AutorunLog = autorunLog;
        autorunLogUploaded = true;
      } else if (file.logType === SpecialLogType.PHD) {
        const phdLog: PHDLog = phdLogReader.parseText(file.text);
        logs.PHDLog = phdLog;
        phdLogUploaded = true;
      }

      if (autorunLogUploaded && phdLogUploaded) {
        emit('logsUploaded', logs);
      }
    };

    return {
      onFileUploaded,
    };
  },
});
</script>

<style scoped>
.main-upload {
  display: block;
}
</style>
