<template>
  <div class="file-uploader">
    <div class="upload-header">
      <h1 class="upload-title">
        <span class="upload-icon">📁</span>
        Upload Your Log Files
      </h1>
      <p class="upload-subtitle">
        Upload both ASIAIR Autorun and PHD2 Guiding log files to analyze your guiding performance
      </p>
    </div>
    
    <div class="upload-grid">
      <div class="upload-card">
        <FileUpload
          fileUploadContainerTitle="ASIAIR Autorun Log"
          :logType="ASIAIR"
          @fileUploaded="onFileUploaded"
          icon="🖥️"
          description="Upload your ASIAIR autorun log file to analyze mount and session data"
        />
      </div>
      <div class="upload-card">
        <FileUpload
          fileUploadContainerTitle="PHD2 Guiding Log"
          :logType="PHD"
          @fileUploaded="onFileUploaded"
          icon="📊"
          description="Upload your PHD2 guiding log file to analyze guiding performance metrics"
        />
      </div>
    </div>
    
    <div class="upload-instructions">
      <h3>📋 Instructions</h3>
      <ul>
        <li>Both log files are required for complete analysis</li>
        <li>Files should be in plain text format (.txt)</li>
        <li>Make sure log files are from the same observation session</li>
        <li>Analysis will begin automatically once both files are uploaded</li>
      </ul>
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
  setup() {
    const asiairStore = useASIAIRStore();
    const phdStore = usePHDStore();
    const appStore = useAppStore();

    let asiairLogUploaded = false;
    let phdLogUploaded = false;

    const asiairLogReader: ASIAIRLogReader = new ASIAIRLogReader();
    const phdLogReader: PHDLogReader = new PHDLogReader();

    const onFileUploaded = (file: { logType: string, text: string }) => {
      try {
        console.log(`Processing ${file.logType} file with ${file.text.length} characters`);
        
        if (file.logType === SpecialLogType.ASIAIR) {
          const asiairLog: ASIAIRLog = asiairLogReader.parseText(file.text);
          console.log('ASIAIR log parsed:', asiairLog);
          asiairStore.dispatch(ASIAIRActionTypes.SET_ASIAIR_LOG, asiairLog);
          asiairLogUploaded = true;
          console.log('ASIAIR log uploaded successfully');
        } else if (file.logType === SpecialLogType.PHD) {
          const phdLog: PHDLog = phdLogReader.parseText(file.text);
          console.log('PHD log parsed:', phdLog);
          console.log('PHD guiding sessions:', phdLog.guidingSessions?.length || 0);
          phdStore.dispatch(PHDActionTypes.SET_PHD_LOG, phdLog);
          phdLogUploaded = true;
          console.log('PHD log uploaded successfully');
        }

        console.log(`Upload status - ASIAIR: ${asiairLogUploaded}, PHD: ${phdLogUploaded}`);
        
        if (asiairLogUploaded && phdLogUploaded) {
          console.log('Both files uploaded, setting files uploaded to true');
          appStore.dispatch(AppActionTypes.SET_FILES_UPLOADED, true);
        }
      } catch (error) {
        console.error(`Error processing ${file.logType} file:`, error);
        // You could add user notification here
        alert(`Error processing ${file.logType} file: ${(error as Error).message || error}`);
      }
    };

    return {
      onFileUploaded,
    };
  },
});
</script>

<style scoped>
.file-uploader {
  max-width: 1000px;
  margin: 0 auto;
}

.upload-header {
  text-align: center;
  margin-bottom: 3rem;
}

.upload-title {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  font-size: 2.5rem;
  font-weight: 700;
  color: var(--gray-800);
  margin-bottom: 1rem;
}

.upload-icon {
  font-size: 3rem;
}

.upload-subtitle {
  font-size: 1.125rem;
  color: var(--gray-600);
  max-width: 600px;
  margin: 0 auto;
  line-height: 1.6;
}

.upload-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 2rem;
  margin-bottom: 3rem;
}

.upload-card {
  background: var(--white);
  border-radius: var(--border-radius-lg);
  box-shadow: var(--shadow);
  transition: var(--transition);
}

.upload-card:hover {
  box-shadow: var(--shadow-md);
  transform: translateY(-2px);
}

.upload-instructions {
  background: linear-gradient(135deg, var(--gray-50) 0%, var(--white) 100%);
  border: 1px solid var(--gray-200);
  border-radius: var(--border-radius-lg);
  padding: 2rem;
  margin-top: 2rem;
}

.upload-instructions h3 {
  color: var(--gray-800);
  font-size: 1.25rem;
  font-weight: 600;
  margin-bottom: 1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.upload-instructions ul {
  list-style: none;
  padding: 0;
}

.upload-instructions li {
  position: relative;
  padding: 0.5rem 0 0.5rem 2rem;
  color: var(--gray-700);
  line-height: 1.5;
}

.upload-instructions li::before {
  content: '✓';
  position: absolute;
  left: 0;
  top: 0.5rem;
  color: var(--success-color);
  font-weight: bold;
}

@media (max-width: 768px) {
  .upload-grid {
    grid-template-columns: 1fr;
    gap: 1.5rem;
  }
  
  .upload-title {
    font-size: 2rem;
    flex-direction: column;
    gap: 0.5rem;
  }
  
  .upload-instructions {
    padding: 1.5rem;
  }
}
</style>
