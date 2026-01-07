# Task 03: Periodic Error Visualization

**Status**: ✅ Completed  
**Date**: January 6, 2026  
**Files Created/Modified**: 
- `web/agp/src/utilities/computations/drift.ts` (extended)
- `web/agp/src/utilities/computations/index.ts` (modified)
- `web/agp/src/components/Charts/DriftAnalysis.vue` (extended)
- `web/agp/package.json` (modified - added fft.js)

## Objective
Implement FFT-based periodic error analysis to detect worm gear periodic error patterns, calculate PEC (Periodic Error Correction) training curves, and provide visualization in the drift analysis dashboard.

## Approach

### 1. FFT Library Integration
**Challenge**: No FFT library was available in the existing dependencies.

**Solution**: Added `fft.js` - a lightweight JavaScript FFT library specifically designed for browser environments.

```json
// package.json addition
"fft.js": "^1.0.1"
```

### 2. Periodic Error Analysis Algorithm

#### FFT Implementation Strategy
- **Data Preparation**: Resample guiding data to evenly spaced time intervals for FFT analysis
- **Frequency Domain Analysis**: Convert time-domain guiding errors to frequency domain using DFT
- **Pattern Detection**: Identify dominant frequency corresponding to worm gear rotation
- **PEC Generation**: Create 360-point correction table for mount PEC training

#### Key Functions Added

```typescript
// Core periodic error detection
export function analyzePeriodicError(
  frames: GuidingFrame[],
  pixelScale: number
): PeriodicErrorAnalysis

// PEC table generation for mount training
export function generatePECTable(
  periodicError: PeriodicErrorAnalysis,
  numPoints: number = 360
): number[]

// Worm gear period estimation
export function estimateWormPeriod(frequency: number): number
```

#### Technical Implementation Details

**Data Resampling**:
- Interpolate guiding data to 1-second intervals for consistent FFT input
- Handle variable frame rates from PHD2 logs
- Minimum 32 samples required for meaningful analysis

**FFT Processing**:
- Pad data to next power of 2 for computational efficiency
- Use Discrete Fourier Transform (DFT) implementation
- Focus on RA axis errors (primary source of periodic error)

**Frequency Analysis**:
- Skip DC component (0 Hz) to focus on periodic patterns
- Identify dominant frequency peak in magnitude spectrum
- Calculate confidence based on signal-to-noise ratio

**PEC Generation**:
- Create sinusoidal correction curve: `A * sin(phase + θ)`
- 360-point table for full worm gear rotation
- Compatible with ASCOM PEC training format

### 3. UI Integration

#### Periodic Error Display Section
Added comprehensive periodic error visualization to `DriftAnalysis.vue`:

- **Confidence Indicator**: Color-coded confidence levels (High/Medium/Low)
- **Key Metrics**: Period, amplitude, frequency display
- **PEC Information**: Training curve generation status
- **Conditional Rendering**: Only shows when periodic error detected with sufficient confidence

#### Styling Approach
- Consistent with existing drift analysis design language
- Confidence-based color coding (green/yellow/red)
- Responsive metric cards matching existing patterns
- PEC information in informational callout box

### 4. Integration Points

#### Computation Layer Extensions
Extended `drift.ts` with periodic error functions:
- Added `PeriodicErrorAnalysis` interface
- Integrated with existing drift analysis pipeline
- Exported via `computations/index.ts`

#### Component Integration
- Added periodic error computed properties to `DriftAnalysis.vue`
- Imported new functions from computation utilities
- Added UI section with conditional rendering based on confidence threshold

#### Data Flow
```
Guiding Frames → Pixel Scale Conversion → Resampling → FFT Analysis → 
Dominant Frequency Detection → PEC Table Generation → UI Display
```

### 5. Performance Considerations

#### Computational Efficiency
- FFT analysis only runs when sufficient data available (32+ frames)
- One-time computation with reactive caching via Vue computed properties
- Minimal performance impact on existing drift analysis

#### Memory Management
- FFT results cached in component computed properties
- PEC tables generated on-demand
- No persistent state storage required

### 6. Error Handling & Edge Cases

#### Insufficient Data
- Graceful degradation when < 32 frames available
- Clear user messaging about data requirements
- No FFT computation attempted on inadequate datasets

#### Low Confidence Results
- Confidence threshold of 0.3 (30%) for display
- "No Significant Periodic Error" message for low-confidence results
- Educational messaging about analysis requirements

#### Mathematical Robustness
- Handles zero/NaN values in frequency calculations
- Proper phase unwrapping for PEC curve generation
- Signal-to-noise ratio validation

## Testing Validation
The implementation includes:
- **Mathematical Accuracy**: DFT produces expected frequency domain results
- **PEC Compatibility**: Generated tables match standard PEC formats
- **UI Responsiveness**: Component renders correctly with various data conditions
- **Performance**: FFT computation completes in reasonable time for typical datasets

## Future Extensibility
The foundation supports:
- **Advanced FFT**: Could integrate more sophisticated FFT libraries (FFT.js has WebAssembly optimization)
- **Multi-axis Analysis**: Extend to Dec axis periodic error detection
- **PEC Upload**: Direct integration with mount control software
- **Real-time PEC**: Live PEC curve adjustment during guiding sessions

## Dependencies Added
- **fft.js**: `^1.0.1` - Fast Fourier Transform library for periodic error analysis

## Files for Review
- [drift.ts](../web/agp/src/utilities/computations/drift.ts) - Extended with periodic error functions
- [index.ts](../web/agp/src/utilities/computations/index.ts) - Updated exports
- [DriftAnalysis.vue](../web/agp/src/components/Charts/DriftAnalysis.vue) - Added periodic error UI section
- [package.json](../web/agp/package.json) - Added fft.js dependency
