# Future Features

This document outlines planned future enhancements for the Astro Guiding Performance application. These features are not currently implemented but are documented for future development.

## Table of Contents
- [Telescope Simulator Enhancements](#telescope-simulator-enhancements)
- [Session Planning & Target Visibility](#session-planning--target-visibility)
- [Advanced Analysis Features](#advanced-analysis-features)
- [Equipment & Hardware Integration](#equipment--hardware-integration)
- [Export & Sharing](#export--sharing)
- [Immersive Technologies](#immersive-technologies)

---

## Telescope Simulator Enhancements

### Video Export
**Priority**: Medium
**Complexity**: Medium
**Description**: Export telescope tracking session animations as video files for sharing and documentation purposes.

**Features**:
- **MP4 Export**: Real-time video recording using MediaRecorder API
  - Configurable resolution: 720p, 1080p, 4K
  - Frame rate options: 15, 30, 60 FPS
  - H.264 encoding for wide compatibility
  - Progress indicator during export

- **GIF Export**: Animated GIF creation using gif.js library
  - Suitable for web sharing and embedding
  - Configurable quality and file size
  - Frame skipping options for smaller files

- **Customization Options**:
  - Include/exclude data overlay panels
  - Choose views: 3D only, 2D only, or both
  - Add title card with session metadata
  - Watermark with equipment information

**Technical Approach**:
```typescript
// Use canvas.captureStream() for real-time encoding
const canvas = document.querySelector('canvas');
const stream = canvas.captureStream(30); // 30 FPS

const mediaRecorder = new MediaRecorder(stream, {
  mimeType: 'video/webm;codecs=vp9',
  videoBitsPerSecond: 5000000
});

// Or frame-by-frame capture for post-processing
const frames: ImageData[] = [];
for (let i = 0; i < totalFrames; i++) {
  renderFrame(i);
  frames.push(captureCanvasFrame());
}
// Encode frames with gif.js or FFmpeg.wasm
```

**Use Cases**:
- Share tracking performance with astrophotography community
- Create tutorials demonstrating tracking issues
- Document mount performance for warranty claims
- Create time-lapses of full imaging sessions

---

### Polar Alignment Quality Indicator
**Priority**: High
**Complexity**: Medium
**Description**: Analyze Dec drift patterns to estimate polar alignment error and provide actionable corrections.

**Features**:
- **Error Magnitude Calculation**:
  - Calculate polar alignment error in arcminutes
  - Decompose into altitude and azimuth components
  - Display confidence interval based on data quality

- **Visual Drift Pattern**:
  - Overlay drift visualization on 2D star chart
  - Color-coded heat map showing drift direction
  - Animated illustration of Dec drift over time

- **Quality Rating**:
  - Color-coded alignment quality (excellent/good/poor)
  - Comparison to mount tracking accuracy specifications
  - Trend analysis over multiple sessions

- **Interactive Correction Guide**:
  - Visual guide showing which adjustment knobs to turn
  - Direction indicators (CW/CCW, up/down)
  - Estimated turns or clicks needed
  - Mount-specific instructions (Celestron vs Sky-Watcher)

**Technical Approach**:
```typescript
/**
 * Analyze Dec drift to determine polar alignment error
 *
 * Altitude error causes Dec drift that varies with hour angle:
 * - East of meridian: drift north (NH) or south (SH)
 * - West of meridian: drift south (NH) or north (SH)
 *
 * Azimuth error causes constant Dec drift:
 * - Always drifts in same direction regardless of hour angle
 */
function analyzePolarAlignment(frames: SimulatorFrame[]): PolarAlignmentAnalysis {
  // Group frames by hour angle quadrant
  const eastFrames = frames.filter(f => f.hourAngle < 0);
  const westFrames = frames.filter(f => f.hourAngle > 0);

  // Calculate Dec drift rates
  const eastDrift = calculateDecDriftRate(eastFrames);
  const westDrift = calculateDecDriftRate(westFrames);

  // Altitude error: drift reverses across meridian
  const altitudeError = (eastDrift - westDrift) / 2;

  // Azimuth error: constant drift both sides
  const azimuthError = (eastDrift + westDrift) / 2;

  return {
    altitudeError, // arcmin
    azimuthError,  // arcmin
    confidence: calculateConfidence(frames),
    corrections: generateCorrections(altitudeError, azimuthError)
  };
}
```

**Integration**:
- Add "Polar Alignment" tab in Telescope Simulator
- Show persistent quality indicator in main view
- Log alignment quality for each session (track improvement)

---

### Drift Analysis Visualization
**Priority**: Medium
**Complexity**: High
**Description**: Advanced overlays showing detailed tracking patterns and identifying specific mount issues.

**Features**:

#### 1. Periodic Error Visualization
- **Detection**: FFT analysis to identify periodic patterns in RA axis
- **Display**: Sine wave overlay on tracking chart showing PE signature
- **Characterization**:
  - Period length (worm gear rotation time)
  - Amplitude (peak-to-peak error in arcseconds)
  - Phase (where in PE cycle session started)
- **Correction**: Calculate PEC (Periodic Error Correction) training curve

#### 2. Declination Backlash Indicator
- **Detection**: Sudden jumps in Dec axis when direction reverses
- **Visualization**: Flag backlash events on chart with warning icons
- **Analysis**:
  - Measure backlash magnitude
  - Identify correlation with wind/vibration
  - Track improvement after adjustment

#### 3. Differential Flexure Tracking
- **Concept**: Detect flexure by correlating errors with telescope position
- **Analysis**:
  - Plot error vs hour angle
  - Plot error vs altitude
  - Identify systematic patterns suggesting mechanical flex
- **Visualization**: Heat map showing error magnitude vs position

#### 4. Environmental Correlation
- **Data Sources**: ASIAIR logs contain temperature data
- **Analysis**:
  - Plot tracking error vs temperature
  - Detect temperature-related drift (focus or mechanical)
  - Correlate with autofocus events
- **Future**: Integrate wind/seeing data from weather APIs

#### 5. Statistical Pattern Detection
- **Fourier Analysis**: Decompose error signal into frequency components
- **Autocorrelation**: Detect repeating patterns
- **Anomaly Detection**: Flag unusual error spikes
- **Trend Analysis**: Long-term drift detection

**Technical Approach**:
```typescript
// Fourier analysis for periodic error
import { fft } from 'fft.js';

function detectPeriodicError(raErrors: number[], timeStamps: Date[]) {
  // Convert to evenly spaced samples
  const sampledData = resampleData(raErrors, timeStamps, 1.0); // 1Hz

  // Apply FFT
  const frequencies = fft(sampledData);

  // Find dominant frequency
  const peakFreq = findPeakFrequency(frequencies);

  // Calculate period (worm gear rotation time)
  const period = 1 / peakFreq; // seconds

  return {
    period,
    amplitude: calculateAmplitude(frequencies, peakFreq),
    phase: calculatePhase(frequencies, peakFreq)
  };
}
```

**UI Components**:
- Toggleable overlays on main tracking chart
- Dedicated "Analysis" tab with detailed breakdowns
- Export analysis report as PDF

---

### Equipment-Specific 3D Models
**Priority**: Low
**Complexity**: High
**Description**: Replace generic mount/telescope visualization with realistic 3D models matching user's equipment.

**Features**:

#### 1. Model Library
Provide pre-made 3D models for popular equipment:
- **Mounts**:
  - Celestron AVX, CGEM, CGX
  - Sky-Watcher HEQ5 Pro, EQ6-R Pro, EQ8
  - iOptron CEM series
  - Software Bisque Paramount
- **Telescopes**:
  - Refractors (William Optics, Takahashi, etc.)
  - Newtonians (various lengths/diameters)
  - SCTs (Celestron, Meade)
  - RC telescopes
- **Accessories**:
  - Guide scopes
  - Finder scopes
  - Camera/focuser assemblies
  - Counterweights

#### 2. Custom Model Import
- **Formats**: Support GLTF/GLB, OBJ with MTL
- **Upload**: Drag-and-drop model files
- **Validation**: Check for valid geometry, reasonable size
- **Preview**: Show model before accepting
- **Persistence**: Save custom models to browser storage

#### 3. Equipment Customization
- **Telescope Tube**:
  - Adjustable length and diameter
  - Color/finish selection (black, white, carbon fiber)
  - Dew shield addition
  - Tube rings customization
- **Camera Setup**:
  - Visualize camera, guide camera, filter wheel
  - Adjustable position on focuser
  - Cable routing visualization
- **Counterweights**:
  - Number and position on shaft
  - Simulate balance point

#### 4. Model Mapping
- Link equipment profiles to 3D models
- Auto-select model based on equipment configuration
- Override with custom selection

**Technical Approach**:
```typescript
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

class EquipmentModelManager {
  private loader = new GLTFLoader();
  private models = new Map<string, GLTF>();

  async loadModel(equipmentId: string, url: string): Promise<void> {
    const gltf = await this.loader.loadAsync(url);
    this.models.set(equipmentId, gltf);
  }

  getMountModel(mountId: string): Object3D | null {
    const gltf = this.models.get(mountId);
    return gltf ? gltf.scene.clone() : null;
  }

  // Map equipment profile to model
  getModelForEquipment(equipment: EquipmentProfile): Object3D {
    // Try to find specific model
    let model = this.getMountModel(equipment.mount.id);

    // Fall back to generic if not found
    if (!model) {
      model = this.getGenericMount(equipment.mount.type);
    }

    return model;
  }
}
```

**Benefits**:
- More immersive and realistic visualization
- Educational value (see how equipment actually moves)
- Better understanding of potential collision issues
- Pride of ownership (see your actual equipment simulated)

---

## Session Planning & Target Visibility

**Priority**: High
**Complexity**: High
**Description**: Pre-imaging session planning tool to optimize target selection based on equipment capabilities and sky conditions.

> **Note**: This feature was specifically requested by the user as a future enhancement to help plan capture sessions by determining what targets are visible based on configured equipment.

**Features**:

### 1. Target Visibility Calculator
- **Input**:
  - Target catalog (Messier, NGC, IC, custom)
  - Observer location (lat/lon) and date/time
  - Equipment constraints (min altitude, meridian flip limits)

- **Output**:
  - Altitude and azimuth over night
  - Transit time (highest altitude)
  - Visibility window (hours above minimum altitude)
  - Recommended imaging duration
  - Meridian flip timing

### 2. Target Database Integration
- **Built-in Catalogs**:
  - Messier objects (M1-M110)
  - NGC (New General Catalogue)
  - IC (Index Catalogue)
  - Popular astrophotography targets

- **Custom Targets**:
  - Add custom coordinates
  - Import from CSV/JSON
  - Save favorite lists

- **Target Information**:
  - RA/Dec coordinates (J2000)
  - Object type (galaxy, nebula, cluster, etc.)
  - Size (angular diameter)
  - Magnitude
  - Best imaging months
  - Suggested exposure times

### 3. Meridian Flip Prediction
- **Analysis**:
  - Calculate when target crosses meridian
  - Predict pier flip timing
  - Estimate guiding interruption
  - Account for mount-specific flip limits

- **Visualization**:
  - Show safe imaging window (green)
  - Warn approaching meridian (yellow)
  - Alert flip zone (red)
  - Animate flip process in 3D view

### 4. Multi-Target Optimization
- **Scheduler**:
  - Input: List of desired targets
  - Optimize: Maximize total imaging time
  - Output: Recommended sequence and timings

- **Constraints**:
  - Minimum altitude per target
  - Setup/meridian flip overhead
  - Priority weighting
  - Moon avoidance

- **Algorithm**: Constraint satisfaction problem (CSP) solver

### 5. Equipment Compatibility Check
- **FOV Matching**:
  - Show target size vs camera FOV
  - Recommend framing (portrait/landscape)
  - Suggest mosaic panels if target too large

- **Focal Length Recommendations**:
  - Warn if target too large (under-sampled)
  - Warn if target too small (over-sampled)
  - Suggest focal length adjustments

### 6. Sky Condition Integration
- **Moon Phase & Position**:
  - Calculate moon illumination percentage
  - Show moon altitude during target visibility
  - Highlight dark time windows

- **Weather Forecast** (API integration):
  - Cloud cover forecast (7Timer!, ClearOutside)
  - Seeing conditions (atmospheric stability)
  - Transparency (humidity, haze)
  - Wind speed (guiding impact)

- **Light Pollution**:
  - Light pollution map overlay
  - Bortle scale integration
  - Impact on different target types

**Technical Approach**:
```typescript
import { julianDate, siderealTime } from './astronomy';

interface Target {
  name: string;
  ra: number;    // degrees
  dec: number;   // degrees
  size: number;  // arcminutes
  type: 'galaxy' | 'nebula' | 'cluster' | 'planetary';
}

interface ObserverLocation {
  latitude: number;   // degrees
  longitude: number;  // degrees
  elevation: number;  // meters
}

function calculateAltAz(
  target: Target,
  location: ObserverLocation,
  datetime: Date
): { altitude: number; azimuth: number } {
  // Calculate Local Sidereal Time
  const jd = julianDate(datetime);
  const lst = siderealTime(jd, location.longitude);

  // Calculate Hour Angle
  const ha = lst - target.ra;

  // Convert to horizontal coordinates (Alt/Az)
  const sinAlt = Math.sin(target.dec * DEG2RAD) * Math.sin(location.latitude * DEG2RAD)
    + Math.cos(target.dec * DEG2RAD) * Math.cos(location.latitude * DEG2RAD) * Math.cos(ha * DEG2RAD);

  const altitude = Math.asin(sinAlt) * RAD2DEG;

  // Calculate azimuth
  const cosA = (Math.sin(target.dec * DEG2RAD) - Math.sin(altitude * DEG2RAD) * Math.sin(location.latitude * DEG2RAD))
    / (Math.cos(altitude * DEG2RAD) * Math.cos(location.latitude * DEG2RAD));

  let azimuth = Math.acos(cosA) * RAD2DEG;
  if (Math.sin(ha * DEG2RAD) > 0) azimuth = 360 - azimuth;

  return { altitude, azimuth };
}

function calculateVisibilityWindow(
  target: Target,
  location: ObserverLocation,
  date: Date,
  minAltitude: number = 30
): { start: Date; end: Date; transitTime: Date; maxAltitude: number } {
  const result = {
    start: null as Date | null,
    end: null as Date | null,
    transitTime: null as Date | null,
    maxAltitude: 0
  };

  // Check altitude every 5 minutes through the night
  const sunset = calculateSunset(location, date);
  const sunrise = calculateSunrise(location, date);

  let maxAlt = 0;
  for (let time = sunset; time < sunrise; time = addMinutes(time, 5)) {
    const { altitude } = calculateAltAz(target, location, time);

    if (altitude > maxAlt) {
      maxAlt = altitude;
      result.maxAltitude = maxAlt;
      result.transitTime = time;
    }

    if (altitude >= minAltitude) {
      if (!result.start) result.start = time;
      result.end = time;
    }
  }

  return result;
}
```

**UI Components**:
- **Target Browser**: Searchable catalog with filters
- **Visibility Chart**: Altitude vs time plot for multiple targets
- **Night Timeline**: Horizontal bar showing imaging windows
- **Sky Map**: Interactive chart showing target positions
- **Scheduler**: Drag-and-drop interface for planning sequence

**Integration**:
- New "Planning" tab in main navigation
- Link to simulator (preview planned session)
- Export plan to .json file
- Import plan into imaging software (N.I.N.A., SGP)

---

## Advanced Analysis Features

### Multi-Session Comparison
**Priority**: Medium
**Complexity**: Medium
**Description**: Compare tracking performance across multiple sessions to identify trends and equipment changes.

**Features**:
- **Session Overlay**:
  - Load multiple log files
  - Overlay tracking error charts
  - Color-code by session/date
  - Synchronized timeline scrubbing

- **Statistical Comparison**:
  - Side-by-side RMS comparison
  - Percentile analysis across sessions
  - Trend detection (improving/degrading)
  - Outlier identification

- **Equipment Change Analysis**:
  - Mark sessions with different equipment
  - Compare before/after mount upgrade
  - Track polar alignment quality over time
  - Measure impact of new guiding camera

- **Export Reports**:
  - Generate PDF comparison report
  - Charts showing trends over time
  - Statistical summaries
  - Recommendations

**Use Cases**:
- Validate mount upgrade effectiveness
- Track polar alignment degradation (needs re-alignment)
- Compare different guide scopes
- Seasonal performance variations (temperature effects)

---

## Equipment & Hardware Integration

### Direct Mount Control (Advanced)
**Priority**: Low
**Complexity**: Very High
**Description**: Control telescope mount directly from the application (requires ASCOM/INDI integration).

**Features**:
- Polar alignment routine (drift method)
- Periodic error recording
- Backlash measurement
- Real-time tracking visualization
- Mount diagnostics

**Note**: Requires native application or browser USB access (WebUSB API)

---

## Export & Sharing

### PDF Report Generation
**Priority**: Medium
**Complexity**: Medium
**Features**:
- Session summary with key statistics
- Embedded charts and graphs
- Equipment information
- Recommendations for improvement
- Export using jsPDF library

### Cloud Sync & Sharing
**Priority**: Low
**Complexity**: High
**Features**:
- Save sessions to cloud storage
- Share sessions with community
- Public profile with stats
- Social features (comments, likes)
- Leaderboards (best RMS by mount/equipment)

**Note**: Requires backend infrastructure

---

## Immersive Technologies

### AR/VR Mode
**Priority**: Low
**Complexity**: Very High
**Description**: Immersive viewing of telescope positioning using WebXR API.

**Features**:

#### 1. VR Headset Support
- **Compatible Devices**: Oculus Quest, HTC Vive, Valve Index
- **Navigation**: 6DOF controllers for playback control
- **Scale**: Life-size mount or miniature model
- **Environment**: Realistic observatory or abstract space

#### 2. AR Smartphone Mode
- **Overlay**: Use phone camera + ARCore/ARKit
- **Placement**: Position virtual mount on table/floor
- **Interaction**: Touch screen for controls
- **Use Case**: Education, demonstration

#### 3. Educational Features
- **Annotations**: 3D labels explaining components
- **Animations**: Show how RA/Dec axes work
- **Tutorials**: Guided tours of mount mechanics
- **Transparency**: X-ray view of internal gears

#### 4. Multi-User
- **Shared Viewing**: Multiple users in same VR space
- **Collaboration**: Discuss tracking issues together
- **Spectator Mode**: Others watch without VR headset

**Technical Approach**:
```typescript
// WebXR setup
const canvas = document.querySelector('canvas');
const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true
});

renderer.xr.enabled = true;

// VR button
document.body.appendChild(VRButton.createButton(renderer));

// VR-specific controls
const controllers = [
  renderer.xr.getController(0),
  renderer.xr.getController(1)
];

controllers[0].addEventListener('selectstart', () => {
  // Play/pause on trigger
  togglePlayback();
});

// Render loop
renderer.setAnimationLoop(() => {
  renderer.render(scene, camera);
});
```

**Challenges**:
- Performance optimization for VR frame rates (90Hz+)
- UI design for 3D space (no flat screens)
- Comfort considerations (motion sickness)
- Limited adoption (requires VR hardware)

---

## Implementation Priorities

### Phase 1 (High Value, Lower Complexity)
1. **Polar Alignment Indicator** - Immediate value for all users
2. **Session Planning** - Frequently requested feature
3. **PDF Report Export** - Easy sharing

### Phase 2 (High Value, Higher Complexity)
1. **Drift Analysis Visualization** - Advanced users
2. **Multi-Session Comparison** - Track improvement
3. **Equipment-Specific Models** - Visual enhancement

### Phase 3 (Nice to Have)
1. **Video Export** - Sharing and documentation
2. **Cloud Sync** - Requires infrastructure
3. **AR/VR Mode** - Experimental, limited audience

---

## Contributing

Have an idea for a new feature? Please:
1. Check if it's already listed here
2. Open a GitHub issue with the `enhancement` label
3. Describe the use case and expected behavior
4. Provide mockups or examples if possible

We welcome community contributions! See [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.

---

*Last Updated*: 2026-01-06
