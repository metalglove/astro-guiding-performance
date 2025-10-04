<template>
  <div class="file-uploader">
    <div class="upload-header">
      <h1 class="upload-title">
        <span class="upload-icon">📁</span>
        Astro Guiding Performance
      </h1>
      <p class="upload-subtitle">
        Analyze your astrophotography guiding performance with detailed metrics and visualizations
      </p>
    </div>

    <!-- Example Data Section - Moved to Top -->
    <div class="example-data-section">
      <div class="example-data-card">
        <div class="example-icon">🚀</div>
        <div class="example-content">
          <h3 class="example-title">Try with Example Data</h3>
          <p class="example-description">
            Explore all features instantly with sample astrophotography log files
          </p>
        </div>
        <button 
          @click="loadExampleData" 
          :disabled="isLoadingExample"
          class="example-btn"
        >
          <span v-if="isLoadingExample" class="loading-spinner"></span>
          <span v-else class="example-btn-icon">⚡</span>
          {{ isLoadingExample ? 'Loading Example Data...' : 'Load Example Data' }}
        </button>
      </div>
    </div>

    <!-- Divider -->
    <div class="section-divider">
      <span class="divider-line"></span>
      <span class="divider-text">or upload your own files</span>
      <span class="divider-line"></span>
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
          icon="🎯"
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
import { defineComponent, ref } from 'vue';
import { useRouter } from 'vue-router';
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
    const router = useRouter();

    let asiairLogUploaded = false;
    let phdLogUploaded = false;

    const asiairLogReader: ASIAIRLogReader = new ASIAIRLogReader();
    const phdLogReader: PHDLogReader = new PHDLogReader();

    const isLoadingExample = ref(false);

    const loadExampleData = async () => {
      console.log('Loading example data...');
      isLoadingExample.value = true;
      
      try {
        // Fetch the example files from the data directory
        const [asiairResponse, phdResponse] = await Promise.all([
          fetch('/data/Autorun_Log_2022-03-18_211302.txt'),
          fetch('/data/PHD2_GuideLog_2022-03-18_210258.txt')
        ]);

        if (!asiairResponse.ok || !phdResponse.ok) {
          throw new Error('Failed to fetch example data files');
        }

        const asiairText = await asiairResponse.text();
        const phdText = await phdResponse.text();

        console.log('Example files fetched successfully');

        // Process ASIAIR log
        const asiairLog: ASIAIRLog = asiairLogReader.parseText(asiairText);
        console.log('Example ASIAIR log parsed:', asiairLog);
        asiairStore.dispatch(ASIAIRActionTypes.SET_ASIAIR_LOG, asiairLog);

        // Process PHD log
        const phdLog: PHDLog = phdLogReader.parseText(phdText);
        console.log('Example PHD log parsed:', phdLog);
        console.log('Example PHD guiding sessions:', phdLog.guidingSessions?.length || 0);
        phdStore.dispatch(PHDActionTypes.SET_PHD_LOG, phdLog);

        // Set files as uploaded
        appStore.dispatch(AppActionTypes.SET_FILES_UPLOADED, true);
        console.log('Example data loaded successfully');
        
        // Navigate to PHD analysis page
        router.push('/phd');
      } catch (error) {
        console.error('Error loading example data:', error);
        alert(`Error loading example data: ${(error as Error).message || error}`);
      } finally {
        isLoadingExample.value = false;
      }
    };

    const onFileUploaded = async (files: Array<{ file: File; logType: SpecialLogType; text: string }>) => {
      console.log('Files uploaded:', files);
      
      for (const file of files) {
        try {
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
          
          // Navigate to PHD analysis page
          router.push('/phd');
        }
      } catch (error) {
        console.error(`Error processing ${file.logType} file:`, error);
        // You could add user notification here
        alert(`Error processing ${file.logType} file: ${(error as Error).message || error}`);
      }
      }
    };

    return {
      onFileUploaded,
      loadExampleData,
      isLoadingExample,
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

/* Example Data Section Styling */
.example-data-section {
  margin-bottom: 3rem;
}

.example-data-card {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: var(--border-radius-lg);
  padding: 2rem;
  color: white;
  box-shadow: 0 10px 30px rgba(102, 126, 234, 0.3);
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
  text-align: center;
  max-width: 600px;
  margin: 0 auto;
}

.example-data-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%);
  pointer-events: none;
}

.example-data-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 15px 40px rgba(102, 126, 234, 0.4);
}

.example-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
  animation: bounce 2s infinite;
  display: block;
}

@keyframes bounce {
  0%, 20%, 50%, 80%, 100% {
    transform: translateY(0);
  }
  40% {
    transform: translateY(-10px);
  }
  60% {
    transform: translateY(-5px);
  }
}

.example-content {
  margin-bottom: 1.5rem;
}

.example-title {
  font-size: 1.5rem;
  font-weight: 700;
  margin: 0 0 0.5rem 0;
  color: white;
}

.example-description {
  font-size: 1rem;
  margin: 0;
  opacity: 0.9;
  line-height: 1.5;
}

.example-btn {
  background: rgba(255, 255, 255, 0.2);
  border: 2px solid rgba(255, 255, 255, 0.3);
  color: white;
  padding: 0.875rem 2rem;
  border-radius: 50px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  backdrop-filter: blur(10px);
  position: relative;
  z-index: 1;
  margin: 0 auto;
}

.example-btn:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.3);
  border-color: rgba(255, 255, 255, 0.5);
  transform: translateY(-2px);
}

.example-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.example-btn-icon {
  font-size: 1.2rem;
}

.loading-spinner {
  width: 1.2rem;
  height: 1.2rem;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top: 2px solid white;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* Section Divider */
.section-divider {
  display: flex;
  align-items: center;
  margin: 3rem 0;
  gap: 1rem;
}

.divider-line {
  flex: 1;
  height: 1px;
  background: linear-gradient(90deg, transparent 0%, var(--gray-300) 50%, transparent 100%);
}

.divider-text {
  color: var(--gray-500);
  font-weight: 500;
  font-size: 0.875rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  padding: 0 1rem;
  background: var(--gray-50);
  border-radius: 20px;
  white-space: nowrap;
}

@media (max-width: 768px) {
  .upload-grid {
    grid-template-columns: 1fr;
    gap: 1.5rem;
  }

  .example-data-card {
    padding: 1.5rem;
  }

  .example-icon {
    font-size: 3rem;
  }

  .example-title {
    font-size: 1.25rem;
  }

  .example-btn {
    width: 100%;
    justify-content: center;
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