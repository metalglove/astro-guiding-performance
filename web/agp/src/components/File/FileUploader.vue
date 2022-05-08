<template>
  <div>
    <h1>Upload log files</h1>
    <div class="main-upload">
      <FileUpload
        fileUploadContainerTitle="ASIAIR Autorun log"
        :logType="ASIAIR"
        @fileUploaded="onFileUploaded"
      />
    </div>
    <div class="main-upload">
      <FileUpload
        fileUploadContainerTitle="PHD2 Guiding log"
        :logType="PHD"
        @fileUploaded="onFileUploaded"
      />
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import SpecialLogType from '../../utilities/SpecialLogType';
import { ASIAIRLog } from '../../store/modules/ASIAIR/ASIAIR.types';
import { PHDLog } from '../../store/modules/PHD/PHD.types';
import FileUpload from './FileUploadComponent.vue';
import ASIAIRLogReader from '../../services/ASIAIRLogReader';
import PHDLogReader from '../../services/PHDLogReader';
import { usePHDStore, useASIAIRStore, useAppStore } from '../../store/';
import { ASIAIRActionTypes } from '../../store/modules/ASIAIR/ASIAIR.actions';
import { PHDActionTypes } from '../../store/modules/PHD/PHD.actions';
import { AppActionTypes } from '../../store/modules/App/App.actions';

export default defineComponent({
  name: 'FileUploader',
  emits: ['logsUploaded'],
  data: () => ({
    ASIAIR: SpecialLogType.ASIAIR,
    PHD: SpecialLogType.PHD,
  }),
  components: {
    FileUpload,
  },
  setup(props, { emit }) {
    const asiairStore = useASIAIRStore();
    const phdStore = usePHDStore();
    const appStore = useAppStore();

    let asiairLogUploaded = false;
    let phdLogUploaded = false;

    const asiairLogReader: ASIAIRLogReader = new ASIAIRLogReader();
    const phdLogReader: PHDLogReader = new PHDLogReader();

    const onFileUploaded = (file: { logType: string, text: string }) => {
      if (file.logType === SpecialLogType.ASIAIR) {
        const asiairLog: ASIAIRLog = asiairLogReader.parseText(file.text);
        asiairStore.dispatch(ASIAIRActionTypes.SET_ASIAIR_LOG, asiairLog);
        asiairLogUploaded = true;
      } else if (file.logType === SpecialLogType.PHD) {
        const phdLog: PHDLog = phdLogReader.parseText(file.text);
        phdStore.dispatch(PHDActionTypes.SET_PHD_LOG, phdLog);
        phdLogUploaded = true;
      }

      if (asiairLogUploaded && phdLogUploaded) {
        appStore.dispatch(AppActionTypes.SET_FILES_UPLOADED, true);
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
