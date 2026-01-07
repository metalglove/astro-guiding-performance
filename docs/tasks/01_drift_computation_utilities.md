# Task 01: Drift Analysis Computation Utilities

**Status**: ✅ Completed  
**Date**: January 6, 2026  
**Files Created/Modified**: 
- `web/agp/src/utilities/computations/drift.ts` (new)
- `web/agp/src/utilities/computations/index.ts` (modified)

## Objective
Create the foundational computation utilities for drift analysis in telescope guiding data, implementing the core algorithms described in the FEATURES.md Phase 2: Drift Analysis Visualization.

## Approach

### 1. Analysis of Requirements
From the codebase exploration and FEATURES.md, the drift analysis needs to support:
- **Basic drift rate calculation** between consecutive guiding frames
- **Directional drift analysis** (RA/Dec components)
- **Statistical analysis** (average, max, stability metrics)
- **Environmental correlation** (temperature vs drift)
- **Backlash detection** (direction changes causing position jumps)
- **Future extensibility** for periodic error analysis

### 2. Data Structure Design
Following existing patterns in the codebase (like `quality.ts` and `statistics.ts`), I designed:

- **`DriftVector`**: Represents drift between two frames with rate, direction, and components
- **`DriftAnalysis`**: Comprehensive analysis results with statistics and correlations  
- **`BacklashEvent`**: Detected backlash events with magnitude and recovery time
- **`PeriodicErrorAnalysis`**: Placeholder for future FFT-based periodic error detection

### 3. Algorithm Implementation

#### Drift Rate Calculation
```typescript
export function calculateDriftRate(
  frame1: GuidingFrame,
  frame2: GuidingFrame, 
  pixelScale: number
): DriftVector | null
```
- Converts pixel errors to arcseconds using pixel scale
- Calculates drift rate in arcseconds per minute
- Determines drift direction using atan2 for proper quadrant handling

#### Statistical Analysis
```typescript
export function analyzeDrift(
  frames: GuidingFrame[],
  pixelScale: number,
  autofocusEvents?: AutoFocusEvent[]
): DriftAnalysis
```
- Computes drift vectors between all consecutive frames
- Calculates weighted average direction (weighted by drift magnitude)
- Computes stability metric (coefficient of variation)
- Optionally correlates with temperature data

#### Temperature Correlation
- Interpolates temperature values at drift vector timestamps
- Calculates Pearson correlation coefficient between drift rate and temperature
- Handles edge cases (insufficient data, no temperature data)

#### Backlash Detection
```typescript
export function detectBacklashEvents(
  frames: GuidingFrame[],
  pixelScale: number,
  threshold: number = 2.0
): BacklashEvent[]
```
- Detects direction changes in RA/DEC corrections
- Measures position jump magnitude
- Estimates recovery time until error stabilizes

### 4. Integration Strategy

#### Following Existing Patterns
- **Pure functions**: All functions are pure, taking data as parameters
- **TypeScript interfaces**: Comprehensive typing following codebase conventions
- **JSDoc documentation**: Detailed parameter and return descriptions
- **Error handling**: Graceful degradation when insufficient data

#### Module Exports
- Added exports to `computations/index.ts` following existing pattern
- Exported both functions and type definitions
- Grouped logically with other computation modules

### 5. Testing Considerations
The implementation includes:
- **Edge case handling**: Empty arrays, single frames, invalid time differences
- **Mathematical robustness**: Proper handling of zero denominators, NaN values
- **Performance**: O(n) algorithms suitable for typical guiding session lengths (1000-10000 frames)

## Next Steps
This foundation enables:
1. **Drift visualization components** - Chart overlays showing drift patterns
2. **Backlash indicators** - Visual markers for detected events  
3. **Environmental correlation charts** - Temperature vs drift rate plots
4. **Statistical summaries** - Drift stability metrics in analysis dashboards

## Dependencies Added
None - uses existing GuidingFrame and AutoFocusEvent interfaces from store modules.

## Files for Review
- [drift.ts](../web/agp/src/utilities/computations/drift.ts) - Core implementation
- [index.ts](../web/agp/src/utilities/computations/index.ts) - Updated exports
