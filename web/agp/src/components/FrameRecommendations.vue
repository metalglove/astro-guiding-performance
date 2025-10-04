<template>
  <div class="frame-recommendations">
    <div class="recommendations-header">
      <h3 class="recommendations-title">
        <span class="recommendations-icon">🎯</span>
        Frame Deletion Recommendations
      </h3>
      <p class="recommendations-subtitle">
        Frames identified as potential candidates for removal to improve image quality
      </p>
    </div>

    <div v-if="!hasRecommendations" class="no-recommendations">
      <div class="no-recommendations-content">
        <span class="no-recommendations-icon">✅</span>
        <div class="no-recommendations-text">
          <h4>Great Guiding Performance!</h4>
          <p>No problematic frames detected that would significantly benefit from removal.</p>
        </div>
      </div>
    </div>

    <div v-else class="recommendations-content">
      <!-- Summary Statistics -->
      <div class="recommendations-summary">
        <div class="summary-card">
          <div class="summary-header">
            <span class="summary-icon">📊</span>
            <h4>Analysis Summary</h4>
          </div>
          <div class="summary-stats">
            <div class="stat-item">
              <span class="stat-label">Total Frames:</span>
              <span class="stat-value">{{ totalFrames.toLocaleString() }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">Problematic Frames:</span>
              <span class="stat-value">{{ problematicFrames.length.toLocaleString() }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">Percentage:</span>
              <span class="stat-value">{{ ((problematicFrames.length / totalFrames) * 100).toFixed(1) }}%</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">Potential Improvement:</span>
              <span class="stat-value">{{ potentialImprovementText }}</span>
            </div>
          </div>
        </div>

        <!-- Impact on Long Exposures -->
        <div class="exposure-impact-card">
          <div class="impact-header">
            <span class="impact-icon">⏱️</span>
            <h4>Long Exposure Impact</h4>
          </div>
          <div class="impact-content">
            <p>
              <strong>Critical Insight:</strong> Even brief moments of poor guiding can dramatically reduce image quality during long exposures. 
              For example, during a 120-second imaging exposure, just 2-3 seconds of poor guiding can cause star trailing 
              across the entire frame, significantly degrading the final image.
            </p>
            <div class="impact-stats">
              <div class="impact-stat">
                <span class="impact-label">Guiding Session Duration:</span>
                <span class="impact-value">{{ formatSessionDuration() }}</span>
              </div>
              <div class="impact-stat">
                <span class="impact-label">Problematic Time:</span>
                <span class="impact-value">{{ formatProblematicTime() }} ({{ ((problematicFrames.length / totalFrames) * 100).toFixed(1) }}%)</span>
              </div>
            </div>
            <div class="impact-warning">
              <span class="warning-icon">⚠️</span>
              <span>Any imaging exposure overlapping with these timeframes may show reduced quality</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Recommendation Categories -->
      <div class="recommendation-categories">
        <div v-if="largeErrorFrames.length > 0" class="category-card error-card">
          <div class="category-header">
            <span class="category-icon">⚠️</span>
            <h4>Large Guiding Errors ({{ largeErrorFrames.length }} frames)</h4>
            <p>Frames with errors &gt; {{ largeErrorThreshold.toFixed(1) }}" - likely atmospheric turbulence or tracking issues</p>
          </div>
          <div class="frame-list">
            <div v-for="frame in largeErrorFrames.slice(0, showAllFrames ? largeErrorFrames.length : 5)" 
                 :key="frame.frame" 
                 class="frame-item">
              <div class="frame-info">
                <span class="frame-number">#{{ frame.frame }}</span>
                <span class="frame-timestamp">{{ formatTimestamp(frame.datetime) }}</span>
                <span class="frame-error">{{ frame.totalError.toFixed(3) }}"</span>
              </div>
              <div class="frame-details">
                <span class="error-component">RA: {{ frame.raError.toFixed(3) }}"</span>
                <span class="error-component">Dec: {{ frame.decError.toFixed(3) }}"</span>
              </div>
            </div>
            <button v-if="largeErrorFrames.length > 5" 
                    @click="showAllFrames = !showAllFrames" 
                    class="show-more-btn">
              {{ showAllFrames ? 'Show Less' : `Show ${largeErrorFrames.length - 5} More` }}
            </button>
          </div>
        </div>

        <div v-if="suddenJumpFrames.length > 0" class="category-card jump-card">
          <div class="category-header">
            <span class="category-icon">📈</span>
            <h4>Sudden Position Jumps ({{ suddenJumpFrames.length }} frames)</h4>
            <p>Frames with abrupt position changes &gt; {{ jumpThreshold.toFixed(1) }}" from previous frame</p>
          </div>
          <div class="frame-list">
            <div v-for="frame in suddenJumpFrames.slice(0, showAllJumps ? suddenJumpFrames.length : 5)" 
                 :key="frame.frame" 
                 class="frame-item">
              <div class="frame-info">
                <span class="frame-number">#{{ frame.frame }}</span>
                <span class="frame-timestamp">{{ formatTimestamp(frame.datetime) }}</span>
                <span class="frame-error">Jump: {{ frame.jumpMagnitude.toFixed(3) }}"</span>
              </div>
            </div>
            <button v-if="suddenJumpFrames.length > 5" 
                    @click="showAllJumps = !showAllJumps" 
                    class="show-more-btn">
              {{ showAllJumps ? 'Show Less' : `Show ${suddenJumpFrames.length - 5} More` }}
            </button>
          </div>
        </div>

        <div v-if="lowSnrFrames.length > 0" class="category-card snr-card">
          <div class="category-header">
            <span class="category-icon">🌟</span>
            <h4>Low SNR Frames ({{ lowSnrFrames.length }} frames)</h4>
            <p>Frames with Signal-to-Noise Ratio &lt; {{ snrThreshold }} - poor star detection</p>
          </div>
          <div class="frame-list">
            <div v-for="frame in lowSnrFrames.slice(0, showAllSnr ? lowSnrFrames.length : 5)" 
                 :key="frame.frame" 
                 class="frame-item">
              <div class="frame-info">
                <span class="frame-number">#{{ frame.frame }}</span>
                <span class="frame-timestamp">{{ formatTimestamp(frame.datetime) }}</span>
                <span class="frame-error">SNR: {{ frame.SNR.toFixed(1) }}</span>
              </div>
            </div>
            <button v-if="lowSnrFrames.length > 5" 
                    @click="showAllSnr = !showAllSnr" 
                    class="show-more-btn">
              {{ showAllSnr ? 'Show Less' : `Show ${lowSnrFrames.length - 5} More` }}
            </button>
          </div>
        </div>

        <div v-if="qualityThresholdFrames.length > 0 && perfectThreshold && goodThreshold" class="category-card quality-card">
          <div class="category-header">
            <span class="category-icon">🎯</span>
            <h4>Quality Threshold Failures ({{ qualityThresholdFrames.length }} frames)</h4>
            <p>Frames with errors &gt; {{ goodThreshold.toFixed(3) }}" (1.0 pixel) - outside acceptable quality range</p>
          </div>
          <div class="frame-list">
            <div v-for="frame in qualityThresholdFrames.slice(0, showAllQuality ? qualityThresholdFrames.length : 5)" 
                 :key="frame.frame" 
                 class="frame-item">
              <div class="frame-info">
                <span class="frame-number">#{{ frame.frame }}</span>
                <span class="frame-timestamp">{{ formatTimestamp(frame.datetime) }}</span>
                <span class="frame-error">{{ frame.totalError.toFixed(3) }}"</span>
              </div>
              <div class="frame-details">
                <span class="error-component">Quality: Poor</span>
                <span class="error-component">Exceeds 1.0px threshold</span>
              </div>
            </div>
            <button v-if="qualityThresholdFrames.length > 5" 
                    @click="showAllQuality = !showAllQuality" 
                    class="show-more-btn">
              {{ showAllQuality ? 'Show Less' : `Show ${qualityThresholdFrames.length - 5} More` }}
            </button>
          </div>
        </div>
      </div>

      <!-- Imaging Frame Analysis -->
      <div v-if="imagingFrameAnalysis.length > 0" class="imaging-frame-section">
        <div class="imaging-frame-header">
          <span class="section-icon">🎬</span>
          <h3>Imaging Frame Drop Recommendations</h3>
          <p>
            <strong>Critical for Long Exposures:</strong> These are complete imaging frames that should be dropped because 
            they contain guiding measurements exceeding quality thresholds. Even brief moments of poor guiding 
            can ruin an entire exposure.
          </p>
        </div>

        <div class="actual-exposure-analysis">
          <div class="analysis-summary">
            <div class="summary-stats">
              <span class="stat-item">
                <strong>{{ imagingFrameAnalysis.length }}</strong> light frames recommended for dropping
              </span>
              <span class="stat-item">
                Based on actual ASIAIR exposure timing and PHD2 guiding data
              </span>
            </div>
          </div>

          <div class="problematic-frames-grid">
            <div v-for="frame in imagingFrameAnalysis.slice(0, 20)" 
                 :key="`image-${frame.imageNumber}`" 
                 class="imaging-frame-card">
              <div class="frame-timing">
                <span class="frame-label">Image #{{ frame.imageNumber }}</span>
                <span class="exposure-duration">{{ frame.integrationTime }} exposure</span>
                <span class="time-range">
                  {{ formatTimestamp(frame.startTime) }} - {{ formatTimestamp(frame.endTime) }}
                </span>
              </div>
              <div class="frame-problems">
                <div class="worst-error">
                  <strong>Worst Error:</strong> {{ frame.worstError.toFixed(3) }}"
                </div>
                <div class="problem-reasons">
                  <span v-for="reason in frame.reasons" :key="reason" class="reason-tag">{{ reason }}</span>
                </div>
                <div class="guiding-stats">
                  <span class="measurement-count">{{ frame.guidingMeasurementCount }} guiding measurements</span>
                  <span class="problematic-count">{{ frame.problematicMeasurements.length }} problematic</span>
                </div>
              </div>
            </div>
          </div>

          <div v-if="imagingFrameAnalysis.length > 20" class="show-more-frames">
            <span>{{ imagingFrameAnalysis.length - 20 }} more images recommended for dropping...</span>
          </div>
        </div>

        <div class="impact-summary">
          <div class="summary-card critical">
            <h4>⚠️ Impact on Image Quality</h4>
            <p>
              Any imaging exposure that overlaps with these time periods will likely show star trailing, 
              elongation, or other guiding artifacts. For best results, exclude these frames from your final stack.
            </p>
          </div>
        </div>
      </div>

      <!-- Export Recommendations -->
      <div class="export-section">
        <div class="export-header">
          <h4>Export Recommendations</h4>
          <p>Save the list of problematic frame timestamps for reference</p>
        </div>
        <div class="export-actions">
          <button @click="exportToClipboard" class="export-btn clipboard-btn">
            <span class="btn-icon">📋</span>
            Copy to Clipboard
          </button>
          <button @click="exportToFile" class="export-btn file-btn">
            <span class="btn-icon">💾</span>
            Download as Text
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { GuidingSession, GuidingFrame } from '../store/modules/PHD/PHD.types';
import { ASIAIRLog, ExposureEvent } from '../store/modules/ASIAIR/ASIAIR.types';
import { useEquipmentStore } from '../store';
import { EquipmentGetterTypes } from '../store/modules/Equipment/Equipment.getters';

interface Props {
  guidingSession: GuidingSession;
  asiairLog?: ASIAIRLog;
  binning?: number;
}

const props = defineProps<Props>();

// Equipment store
const equipmentStore = useEquipmentStore();

// Get active profile and camera specifications
const activeProfile = computed(() => equipmentStore.getters(EquipmentGetterTypes.ACTIVE_PROFILE) as any);
const presetCameras = computed(() => equipmentStore.getters(EquipmentGetterTypes.PRESET_CAMERAS) as any[]);

// Default to active profile's imaging camera, fallback to ASI 2600 MM Pro specs
const imagingCameraSpecs = computed(() => {
  if (activeProfile.value?.imagingCamera) {
    return activeProfile.value.imagingCamera;
  }
  // Fallback to ASI 2600 MM Pro specs
  return {
    name: 'ASI 2600 MM Pro (default)',
    pixelSize: 3.76,
    width: 6248,
    height: 4176
  };
});

const binning = computed(() => props.binning || 1);

// Calculate the actual pixel scale for the main imaging camera
// This uses the telescope focal length and the imaging camera pixel size
const imagingPixelScale = computed(() => {
  const specs = imagingCameraSpecs.value;
  const effectiveBinning = binning.value;
  
  // Get focal length from active equipment profile or fallback to 800mm
  const telescopeFocalLength = activeProfile.value?.telescope?.focalLength ?? 800; // mm
  
  // Calculate pixel scale: (pixel size in μm × 206265) / focal length in mm
  const effectivePixelSize = specs.pixelSize * effectiveBinning;
  const pixelScale = (effectivePixelSize * 206265) / telescopeFocalLength;
  
  return pixelScale / 1000; // Convert from milliarcsec to arcsec
});

// State
const showAllFrames = ref(false);
const showAllJumps = ref(false);
const showAllSnr = ref(false);
const showAllQuality = ref(false);

// Analysis thresholds (in arcseconds based on imaging camera pixel scale)
const largeErrorThreshold = computed(() => imagingPixelScale.value ? imagingPixelScale.value * 3 : 2.0); // 3 pixels or 2 arcsec
const jumpThreshold = computed(() => imagingPixelScale.value ? imagingPixelScale.value * 2 : 1.5); // 2 pixels or 1.5 arcsec
const snrThreshold = 10; // SNR threshold

// Quality thresholds based on pixel-well analysis for imaging camera
const perfectThreshold = computed(() => imagingPixelScale.value ? imagingPixelScale.value * 0.5 : null); // 0.5 pixels
const goodThreshold = computed(() => imagingPixelScale.value ? imagingPixelScale.value * 1.0 : null); // 1.0 pixels

// Helper function to calculate total error for a frame using imaging camera pixel scale
const calculateFrameError = (frame: GuidingFrame): number => {
  if (!imagingPixelScale.value) {
    // If no pixel scale, use raw pixel coordinates
    return Math.sqrt(frame.dx * frame.dx + frame.dy * frame.dy);
  }
  // Convert to arcseconds using imaging camera pixel scale (match PHDLogGuidingCharts calculation)
  const x = frame.dx * imagingPixelScale.value;
  const y = frame.dy * imagingPixelScale.value;
  return Math.sqrt(x * x + y * y);
};

// Analysis computations
const totalFrames = computed(() => props.guidingSession.guidingFrames.length);

const largeErrorFrames = computed(() => {
  return props.guidingSession.guidingFrames
    .map(frame => {
      const totalError = calculateFrameError(frame);
      const raError = Math.abs(frame.dx * (imagingPixelScale.value || 1));
      const decError = Math.abs(frame.dy * (imagingPixelScale.value || 1));
      return { ...frame, totalError, raError, decError };
    })
    .filter(frame => frame.totalError > largeErrorThreshold.value)
    .sort((a, b) => b.totalError - a.totalError);
});

const suddenJumpFrames = computed(() => {
  const jumps: Array<GuidingFrame & { jumpMagnitude: number }> = [];
  
  for (let i = 1; i < props.guidingSession.guidingFrames.length; i++) {
    const current = props.guidingSession.guidingFrames[i];
    const previous = props.guidingSession.guidingFrames[i - 1];
    
    const dx = current.dx - previous.dx;
    const dy = current.dy - previous.dy;
    const jumpMagnitude = Math.sqrt(dx * dx + dy * dy) * (imagingPixelScale.value || 1);
    
    if (jumpMagnitude > jumpThreshold.value) {
      jumps.push({ ...current, jumpMagnitude });
    }
  }
  
  return jumps.sort((a, b) => b.jumpMagnitude - a.jumpMagnitude);
});

const lowSnrFrames = computed(() => {
  return props.guidingSession.guidingFrames
    .filter(frame => frame.SNR < snrThreshold && !isNaN(frame.SNR))
    .sort((a, b) => a.SNR - b.SNR);
});

const qualityThresholdFrames = computed(() => {
  // Only analyze if we have pixel scale for meaningful thresholds
  if (!perfectThreshold.value || !goodThreshold.value) {
    return [];
  }

  return props.guidingSession.guidingFrames
    .map(frame => {
      const totalError = calculateFrameError(frame);
      let qualityLevel = 'excellent';
      
      if (totalError > goodThreshold.value!) {
        qualityLevel = 'poor';
      } else if (totalError > perfectThreshold.value!) {
        qualityLevel = 'acceptable';
      }
      
      return { ...frame, totalError, qualityLevel };
    })
    .filter(frame => frame.qualityLevel === 'poor') // Only recommend frames outside good threshold
    .sort((a, b) => b.totalError - a.totalError);
});

// Real Imaging Frame Analysis - Uses actual ASIAIR exposure data
const imagingFrameAnalysis = computed(() => {
  if (!props.guidingSession.guidingFrames.length || !props.asiairLog) return [];
  
  const problematicFrames: Array<{
    imageNumber: number;
    integrationTime: string;
    startTime: Date;
    endTime: Date;
    problematicMeasurements: GuidingFrame[];
    worstError: number;
    reasons: string[];
    guidingMeasurementCount: number;
  }> = [];
  
  // Get all light frame exposures from ASIAIR log
  const lightFrames = props.asiairLog.autoruns
    .flatMap(autorun => autorun.exposureEvents)
    .filter(exposure => exposure.type === 'Light')
    .sort((a, b) => new Date(a.datetime).getTime() - new Date(b.datetime).getTime());
  
  const guidingFrames = props.guidingSession.guidingFrames;
  
  // For each actual light frame exposure, check if guiding was problematic
  lightFrames.forEach(exposure => {
    const exposureStartTime = new Date(exposure.datetime);
    // Parse integration time (e.g., "120.0s" -> 120 seconds)
    const integrationSeconds = parseFloat(exposure.integrationTime.replace('s', ''));
    const exposureEndTime = new Date(exposureStartTime.getTime() + (integrationSeconds * 1000));
    
    // Find all guiding measurements that occurred during this exposure
    const measurementsDuringExposure = guidingFrames.filter(frame => {
      const frameTime = new Date(frame.datetime);
      return frameTime >= exposureStartTime && frameTime <= exposureEndTime;
    });
    
    if (measurementsDuringExposure.length === 0) return; // No guiding data for this exposure
    
    // Analyze guiding quality during this specific exposure
    const problematicMeasurements: GuidingFrame[] = [];
    const reasons: string[] = [];
    let worstError = 0;
    
    measurementsDuringExposure.forEach(measurement => {
      const totalError = calculateFrameError(measurement);
      if (totalError > worstError) worstError = totalError;
      
      // Check various quality thresholds
      if (goodThreshold.value && totalError > goodThreshold.value) {
        problematicMeasurements.push(measurement);
        if (!reasons.includes('Quality threshold exceeded')) {
          reasons.push('Quality threshold exceeded');
        }
      }
      
      if (totalError > largeErrorThreshold.value) {
        problematicMeasurements.push(measurement);
        if (!reasons.includes('Large error detected')) {
          reasons.push('Large error detected');
        }
      }
      
      if (measurement.SNR < snrThreshold && !isNaN(measurement.SNR)) {
        problematicMeasurements.push(measurement);
        if (!reasons.includes('Low SNR')) {
          reasons.push('Low SNR');
        }
      }
      
      // Check for sudden jumps during exposure
      const frameIndex = guidingFrames.indexOf(measurement);
      if (frameIndex > 0) {
        const prevFrame = guidingFrames[frameIndex - 1];
        const dx = measurement.dx - prevFrame.dx;
        const dy = measurement.dy - prevFrame.dy;
        const jumpMagnitude = Math.sqrt(dx * dx + dy * dy) * (imagingPixelScale.value || 1);
        
        if (jumpMagnitude > jumpThreshold.value) {
          problematicMeasurements.push(measurement);
          if (!reasons.includes('Sudden position jump')) {
            reasons.push('Sudden position jump');
          }
        }
      }
    });
    
    // If ANY guiding measurement during this exposure was problematic, recommend dropping the entire frame
    if (problematicMeasurements.length > 0) {
      problematicFrames.push({
        imageNumber: exposure.image,
        integrationTime: exposure.integrationTime,
        startTime: exposureStartTime,
        endTime: exposureEndTime,
        problematicMeasurements: [...new Set(problematicMeasurements)], // Remove duplicates
        worstError,
        reasons: [...new Set(reasons)], // Remove duplicate reasons
        guidingMeasurementCount: measurementsDuringExposure.length
      });
    }
  });
  
  return problematicFrames;
});

const problematicFrames = computed(() => {
  const frameSet = new Set<number>();
  
  largeErrorFrames.value.forEach(frame => frameSet.add(frame.frame));
  suddenJumpFrames.value.forEach(frame => frameSet.add(frame.frame));
  lowSnrFrames.value.forEach(frame => frameSet.add(frame.frame));
  qualityThresholdFrames.value.forEach(frame => frameSet.add(frame.frame));
  
  return Array.from(frameSet).sort((a, b) => a - b);
});

const hasRecommendations = computed(() => problematicFrames.value.length > 0);

const potentialImprovementText = computed(() => {
  if (problematicFrames.value.length === 0) return "N/A";
  
  const percentage = (problematicFrames.value.length / totalFrames.value) * 100;
  if (percentage > 10) return "Significant";
  if (percentage > 5) return "Moderate";
  return "Minor";
});

// Formatting functions
const formatTimestamp = (datetime: Date): string => {
  return new Date(datetime).toLocaleTimeString();
};

const formatSessionDuration = (): string => {
  if (!props.guidingSession.guidingFrames.length) return '0s';
  
  const firstFrame = props.guidingSession.guidingFrames[0];
  const lastFrame = props.guidingSession.guidingFrames[props.guidingSession.guidingFrames.length - 1];
  
  const firstTime = new Date(firstFrame.datetime).getTime();
  const lastTime = new Date(lastFrame.datetime).getTime();
  const durationMs = lastTime - firstTime;
  const durationSeconds = Math.round(durationMs / 1000);
  
  const hours = Math.floor(durationSeconds / 3600);
  const minutes = Math.floor((durationSeconds % 3600) / 60);
  const seconds = durationSeconds % 60;
  
  if (hours > 0) {
    return `${hours}h ${minutes}m ${seconds}s`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds}s`;
  } else {
    return `${seconds}s`;
  }
};

const formatProblematicTime = (): string => {
  if (!props.guidingSession.guidingFrames.length || !problematicFrames.value.length) return '0s';
  
  // Estimate problematic time based on frame rate
  // PHD2 typically guides at 1-3 second intervals
  const totalFrames = props.guidingSession.guidingFrames.length;
  const firstFrame = props.guidingSession.guidingFrames[0];
  const lastFrame = props.guidingSession.guidingFrames[props.guidingSession.guidingFrames.length - 1];
  const totalDurationMs = new Date(lastFrame.datetime).getTime() - new Date(firstFrame.datetime).getTime();
  const avgFrameInterval = totalDurationMs / Math.max(totalFrames - 1, 1);
  
  const problematicDurationMs = problematicFrames.value.length * avgFrameInterval;
  const problematicSeconds = Math.round(problematicDurationMs / 1000);
  
  const minutes = Math.floor(problematicSeconds / 60);
  const seconds = problematicSeconds % 60;
  
  if (minutes > 0) {
    return `${minutes}m ${seconds}s`;
  } else {
    return `${seconds}s`;
  }
};

// Export functions
const exportToClipboard = async () => {
  const content = generateExportContent();
  try {
    await navigator.clipboard.writeText(content);
    // Could add a toast notification here
  } catch (err) {
    console.error('Failed to copy to clipboard:', err);
  }
};

const exportToFile = () => {
  const content = generateExportContent();
  const blob = new Blob([content], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `guiding-frame-recommendations-${new Date().toISOString().split('T')[0]}.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

const generateExportContent = (): string => {
  let content = `Guiding Frame Deletion Recommendations\n`;
  content += `Generated: ${new Date().toLocaleString()}\n`;
  content += `Session: ${new Date(props.guidingSession.startTime).toLocaleString()}\n`;
  content += `Total Frames: ${totalFrames.value}\n`;
  content += `Problematic Frames: ${problematicFrames.value.length}\n\n`;
  
  if (largeErrorFrames.value.length > 0) {
    content += `Large Error Frames (${largeErrorThreshold.value.toFixed(1)}"):\n`;
    largeErrorFrames.value.forEach(frame => {
      content += `  Frame #${frame.frame} at ${formatTimestamp(frame.datetime)} - Error: ${frame.totalError.toFixed(3)}"\n`;
    });
    content += '\n';
  }
  
  if (suddenJumpFrames.value.length > 0) {
    content += `Sudden Jump Frames (${jumpThreshold.value.toFixed(1)}"):\n`;
    suddenJumpFrames.value.forEach(frame => {
      content += `  Frame #${frame.frame} at ${formatTimestamp(frame.datetime)} - Jump: ${frame.jumpMagnitude.toFixed(3)}"\n`;
    });
    content += '\n';
  }
  
  if (lowSnrFrames.value.length > 0) {
    content += `Low SNR Frames (${snrThreshold}):\n`;
    lowSnrFrames.value.forEach(frame => {
      content += `  Frame #${frame.frame} at ${formatTimestamp(frame.datetime)} - SNR: ${frame.SNR.toFixed(1)}\n`;
    });
    content += '\n';
  }
  
  if (qualityThresholdFrames.value.length > 0 && goodThreshold.value) {
    content += `Quality Threshold Failures (>${goodThreshold.value.toFixed(3)}"):\n`;
    qualityThresholdFrames.value.forEach(frame => {
      content += `  Frame #${frame.frame} at ${formatTimestamp(frame.datetime)} - Error: ${frame.totalError.toFixed(3)}"\n`;
    });
    content += '\n';
  }
  
  content += `All Problematic Frame Numbers:\n`;
  content += problematicFrames.value.join(', ');
  
  return content;
};
</script>

<style scoped>
.frame-recommendations {
  background: linear-gradient(135deg, var(--card-bg) 0%, rgba(255, 255, 255, 0.05) 100%);
  border: 1px solid var(--border-color);
  border-radius: 16px;
  padding: 24px;
  margin-bottom: 24px;
  backdrop-filter: blur(10px);
}

.recommendations-header {
  margin-bottom: 24px;
}

.recommendations-title {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 20px;
  font-weight: 700;
  color: var(--text-color);
  margin: 0 0 8px 0;
}

.recommendations-icon {
  font-size: 24px;
}

.recommendations-subtitle {
  color: var(--text-muted);
  font-size: 14px;
  margin: 0;
}

.no-recommendations {
  background: #f0fdf4;
  border: 1px solid #16a34a;
  border-radius: 12px;
  padding: 20px;
}

.no-recommendations-content {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.no-recommendations-icon {
  font-size: 24px;
  flex-shrink: 0;
}

.no-recommendations-text h4 {
  margin: 0 0 8px 0;
  font-size: 16px;
  font-weight: 600;
  color: #166534;
}

.no-recommendations-text p {
  margin: 0;
  font-size: 14px;
  color: #166534;
  line-height: 1.5;
}

.recommendations-summary {
  margin-bottom: 24px;
}

.summary-card {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 20px;
}

.summary-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
}

.summary-icon {
  font-size: 18px;
}

.summary-header h4 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--text-color);
}

.summary-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 12px;
}

.stat-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.stat-item:last-child {
  border-bottom: none;
}

.stat-label {
  font-size: 14px;
  color: var(--text-muted);
  font-weight: 500;
}

.stat-value {
  font-size: 14px;
  color: var(--text-color);
  font-weight: 600;
}

/* Exposure Impact Card */
.exposure-impact-card {
  background: rgba(245, 158, 11, 0.05);
  border: 1px solid rgba(245, 158, 11, 0.2);
  border-radius: 12px;
  padding: 20px;
  margin-top: 16px;
}

.impact-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
}

.impact-icon {
  font-size: 18px;
}

.impact-header h4 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--text-color);
}

.impact-content p {
  margin: 0 0 16px 0;
  font-size: 14px;
  line-height: 1.5;
  color: var(--text-color);
}

.impact-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 12px;
  margin-bottom: 16px;
}

.impact-stat {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
}

.impact-label {
  font-size: 13px;
  color: var(--text-muted);
  font-weight: 500;
}

.impact-value {
  font-size: 13px;
  color: var(--text-color);
  font-weight: 600;
}

.impact-warning {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px;
  background: rgba(245, 158, 11, 0.1);
  border-radius: 8px;
  font-size: 13px;
  color: #f59e0b;
  font-weight: 500;
}

.warning-icon {
  font-size: 16px;
}

.recommendation-categories {
  display: flex;
  flex-direction: column;
  gap: 20px;
  margin-bottom: 24px;
}

.category-card {
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 20px;
}

.error-card {
  border-left: 4px solid #ef4444;
}

.jump-card {
  border-left: 4px solid #f59e0b;
}

.snr-card {
  border-left: 4px solid #8b5cf6;
}

.quality-card {
  border-left: 4px solid #06b6d4;
}

.category-header {
  margin-bottom: 16px;
}

.category-header h4 {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0 0 8px 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--text-color);
}

.category-icon {
  font-size: 18px;
}

.category-header p {
  margin: 0;
  font-size: 13px;
  color: var(--text-muted);
  line-height: 1.4;
}

.frame-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.frame-item {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  padding: 12px;
}

.frame-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
}

.frame-number {
  font-weight: 600;
  color: var(--text-color);
  font-size: 14px;
}

.frame-timestamp {
  font-size: 13px;
  color: var(--text-muted);
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
}

.frame-error {
  font-size: 13px;
  font-weight: 600;
  color: #ef4444;
}

.frame-details {
  display: flex;
  gap: 16px;
  font-size: 12px;
}

.error-component {
  color: var(--text-muted);
}

.show-more-btn {
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 6px;
  padding: 8px 16px;
  color: var(--text-color);
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s ease;
  margin-top: 8px;
}

.show-more-btn:hover {
  background: rgba(255, 255, 255, 0.15);
  transform: translateY(-1px);
}

.export-section {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 20px;
}

.export-header {
  margin-bottom: 16px;
}

.export-header h4 {
  margin: 0 0 8px 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--text-color);
}

.export-header p {
  margin: 0;
  font-size: 13px;
  color: var(--text-muted);
}

.export-actions {
  display: flex;
  gap: 12px;
}

.export-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  background: linear-gradient(135deg, var(--primary-color) 0%, var(--primary-dark) 100%);
  color: white;
  border: none;
  border-radius: 8px;
  padding: 10px 16px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.export-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.btn-icon {
  font-size: 16px;
}

@media (max-width: 768px) {
  .frame-recommendations {
    padding: 16px;
  }
  
  .summary-stats {
    grid-template-columns: 1fr;
  }
  
  .frame-info {
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
  }
  
  .export-actions {
    flex-direction: column;
  }
  
  .export-btn {
    justify-content: center;
  }
}

@media (max-width: 480px) {
  .frame-details {
    flex-direction: column;
    gap: 4px;
  }
}

/* Imaging Frame Analysis */
.imaging-frame-section {
  background: rgba(239, 68, 68, 0.05);
  border: 1px solid rgba(239, 68, 68, 0.2);
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 24px;
}

.imaging-frame-header {
  text-align: center;
  margin-bottom: 24px;
}

.section-icon {
  font-size: 24px;
  display: block;
  margin-bottom: 8px;
}

.imaging-frame-header h3 {
  margin: 0 0 12px 0;
  font-size: 20px;
  font-weight: 700;
  color: var(--text-color);
}

.imaging-frame-header p {
  margin: 0;
  font-size: 14px;
  line-height: 1.5;
  color: var(--text-muted);
  max-width: 600px;
  margin: 0 auto;
}

.actual-exposure-analysis {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  padding: 20px;
}

.analysis-summary {
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.summary-stats {
  display: flex;
  flex-direction: column;
  gap: 8px;
  text-align: center;
}

.stat-item {
  font-size: 14px;
  color: var(--text-color);
}

.stat-item:first-child {
  font-size: 16px;
  font-weight: 600;
  color: #ef4444;
}

.exposure-duration {
  font-size: 12px;
  color: var(--text-muted);
  font-weight: 500;
  background: rgba(255, 255, 255, 0.1);
  padding: 2px 6px;
  border-radius: 4px;
  margin-bottom: 4px;
  display: inline-block;
}

.problematic-frames-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 16px;
  margin-bottom: 16px;
}

.imaging-frame-card {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  padding: 16px;
}

.frame-timing {
  margin-bottom: 12px;
}

.frame-label {
  display: block;
  font-weight: 600;
  color: var(--text-color);
  margin-bottom: 4px;
}

.time-range {
  font-size: 13px;
  color: var(--text-muted);
  font-family: monospace;
}

.frame-problems {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.worst-error {
  font-size: 14px;
  color: var(--text-color);
}

.problem-reasons {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.reason-tag {
  background: rgba(239, 68, 68, 0.2);
  color: #ef4444;
  font-size: 11px;
  padding: 3px 8px;
  border-radius: 4px;
  font-weight: 500;
}

.affected-measurements {
  font-size: 12px;
  color: var(--text-muted);
}

.guiding-stats {
  display: flex;
  gap: 12px;
  font-size: 12px;
}

.measurement-count {
  color: var(--text-muted);
}

.problematic-count {
  color: #ef4444;
  font-weight: 500;
}

.show-more-frames {
  text-align: center;
  padding: 12px;
  font-size: 13px;
  color: var(--text-muted);
  font-style: italic;
}

.impact-summary {
  margin-top: 20px;
}

.summary-card.critical {
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: 8px;
  padding: 16px;
}

.summary-card.critical h4 {
  margin: 0 0 8px 0;
  color: #ef4444;
  font-size: 16px;
}

.summary-card.critical p {
  margin: 0;
  font-size: 14px;
  line-height: 1.5;
  color: var(--text-color);
}

@media (max-width: 768px) {
  .exposure-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
  
  .problematic-frames-grid {
    grid-template-columns: 1fr;
  }
}
</style>
