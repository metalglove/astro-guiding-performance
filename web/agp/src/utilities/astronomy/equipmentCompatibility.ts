import { DeepSkyObject } from '@/data/targets';

export interface CameraSpecs {
  sensorWidthMM: number;
  sensorHeightMM: number;
  pixelSizeUM: number;
  resolutionX: number;
  resolutionY: number;
}

export interface TelescopeSpecs {
  focalLengthMM: number;
  apertureMM: number;
  focalRatio: number;
}

export interface FieldOfView {
  widthArcmin: number;
  heightArcmin: number;
  diagonalArcmin: number;
  widthDegrees: number;
  heightDegrees: number;
  diagonalDegrees: number;
}

export interface CompatibilityResult {
  compatible: boolean;
  fov: FieldOfView;
  targetSizeArcmin: number;
  coveragePercent: number;
  samplingRatio: number;
  recommendation: string;
  framingSuggestion: 'portrait' | 'landscape' | 'either';
  mosaicPanels?: { rows: number; cols: number; total: number };
  warnings: string[];
}

export function calculateFieldOfView(
  camera: CameraSpecs,
  telescope: TelescopeSpecs
): FieldOfView {
  const widthArcmin = (camera.sensorWidthMM / telescope.focalLengthMM) * 206265 / 60;
  const heightArcmin = (camera.sensorHeightMM / telescope.focalLengthMM) * 206265 / 60;
  const diagonalMM = Math.sqrt(camera.sensorWidthMM ** 2 + camera.sensorHeightMM ** 2);
  const diagonalArcmin = (diagonalMM / telescope.focalLengthMM) * 206265 / 60;
  
  return {
    widthArcmin,
    heightArcmin,
    diagonalArcmin,
    widthDegrees: widthArcmin / 60,
    heightDegrees: heightArcmin / 60,
    diagonalDegrees: diagonalArcmin / 60
  };
}

export function calculatePixelScale(
  camera: CameraSpecs,
  telescope: TelescopeSpecs
): number {
  return (camera.pixelSizeUM / telescope.focalLengthMM) * 206.265;
}

export function checkEquipmentCompatibility(
  target: DeepSkyObject,
  camera: CameraSpecs,
  telescope: TelescopeSpecs
): CompatibilityResult {
  const fov = calculateFieldOfView(camera, telescope);
  const pixelScale = calculatePixelScale(camera, telescope);
  
  const targetSizeArcmin = target.size;
  
  const warnings: string[] = [];
  let compatible = true;
  let recommendation = '';
  let framingSuggestion: 'portrait' | 'landscape' | 'either' = 'either';
  let mosaicPanels: { rows: number; cols: number; total: number } | undefined;
  
  const minFOV = Math.min(fov.widthArcmin, fov.heightArcmin);
  const maxFOV = Math.max(fov.widthArcmin, fov.heightArcmin);
  
  let coveragePercent = 0;
  if (targetSizeArcmin <= minFOV) {
    coveragePercent = (targetSizeArcmin / minFOV) * 100;
  } else if (targetSizeArcmin <= maxFOV) {
    coveragePercent = (targetSizeArcmin / maxFOV) * 100;
  } else {
    coveragePercent = 100;
  }
  
  const samplingRatio = targetSizeArcmin / minFOV;
  
  if (samplingRatio < 0.1) {
    compatible = false;
    warnings.push('Target is very small compared to FOV (under-sampled)');
    recommendation = `Target occupies only ${coveragePercent.toFixed(1)}% of frame. Consider longer focal length (${Math.ceil(telescope.focalLengthMM * 2)}mm+) or crop sensor.`;
  } else if (samplingRatio < 0.3) {
    warnings.push('Target is small in frame');
    recommendation = `Target occupies ${coveragePercent.toFixed(1)}% of frame. Good for context, but consider longer focal length for detail.`;
  } else if (samplingRatio > 3.0) {
    compatible = false;
    warnings.push('Target is too large for single frame (over-sampled)');
    
    const panelsNeeded = Math.ceil(samplingRatio);
    const rows = Math.ceil(Math.sqrt(panelsNeeded));
    const cols = Math.ceil(panelsNeeded / rows);
    
    mosaicPanels = { rows, cols, total: rows * cols };
    
    recommendation = `Target is ${samplingRatio.toFixed(1)}x larger than FOV. Requires ${mosaicPanels.total}-panel mosaic (${mosaicPanels.rows}x${mosaicPanels.cols}) or shorter focal length (${Math.floor(telescope.focalLengthMM / 2)}mm).`;
  } else if (samplingRatio > 1.5) {
    warnings.push('Target extends beyond single frame');
    recommendation = `Target is ${samplingRatio.toFixed(1)}x larger than FOV. Consider mosaic or shorter focal length.`;
  } else {
    recommendation = `Excellent match! Target occupies ${coveragePercent.toFixed(1)}% of frame with good framing.`;
  }
  
  if (targetSizeArcmin > fov.widthArcmin && targetSizeArcmin <= fov.heightArcmin) {
    framingSuggestion = 'portrait';
    warnings.push('Portrait orientation recommended for better framing');
  } else if (targetSizeArcmin > fov.heightArcmin && targetSizeArcmin <= fov.widthArcmin) {
    framingSuggestion = 'landscape';
    warnings.push('Landscape orientation recommended for better framing');
  }
  
  if (pixelScale < 0.5) {
    warnings.push(`Very fine pixel scale (${pixelScale.toFixed(2)}"/px) - excellent for detail but demands good seeing and guiding`);
  } else if (pixelScale > 3.0) {
    warnings.push(`Coarse pixel scale (${pixelScale.toFixed(2)}"/px) - may under-sample finer details`);
  }
  
  const aperture = telescope.apertureMM;
  const theoreticalResolution = 138 / aperture;
  if (pixelScale < theoreticalResolution / 2) {
    warnings.push(`Over-sampled: pixel scale (${pixelScale.toFixed(2)}"/px) is finer than ${(theoreticalResolution / 2).toFixed(2)}"/px (half telescope resolution)`);
  } else if (pixelScale > theoreticalResolution * 2) {
    warnings.push(`Under-sampled: pixel scale (${pixelScale.toFixed(2)}"/px) is coarser than ${(theoreticalResolution * 2).toFixed(2)}"/px (2x telescope resolution)`);
  }
  
  return {
    compatible,
    fov,
    targetSizeArcmin,
    coveragePercent,
    samplingRatio,
    recommendation,
    framingSuggestion,
    mosaicPanels,
    warnings
  };
}

export function suggestFocalLength(
  target: DeepSkyObject,
  camera: CameraSpecs,
  desiredCoveragePercent: number = 70
): { minFocalLength: number; maxFocalLength: number; optimalFocalLength: number } {
  const targetSizeArcmin = target.size;
  
  const minSensorMM = Math.min(camera.sensorWidthMM, camera.sensorHeightMM);
  
  const optimalFOV = targetSizeArcmin / (desiredCoveragePercent / 100);
  const optimalFocalLength = (minSensorMM / optimalFOV) * 206265 / 60;
  
  const minFOV = targetSizeArcmin * 2;
  const maxFOV = targetSizeArcmin * 0.5;
  
  const maxFocalLength = (minSensorMM / maxFOV) * 206265 / 60;
  const minFocalLength = (minSensorMM / minFOV) * 206265 / 60;
  
  return {
    minFocalLength: Math.floor(minFocalLength / 50) * 50,
    maxFocalLength: Math.ceil(maxFocalLength / 50) * 50,
    optimalFocalLength: Math.round(optimalFocalLength / 50) * 50
  };
}

export function compareEquipmentSetups(
  target: DeepSkyObject,
  setups: Array<{ name: string; camera: CameraSpecs; telescope: TelescopeSpecs }>
): Array<{ name: string; result: CompatibilityResult; score: number }> {
  const comparisons = setups.map(setup => {
    const result = checkEquipmentCompatibility(target, setup.camera, setup.telescope);
    
    let score = 0;
    
    if (result.samplingRatio >= 0.3 && result.samplingRatio <= 1.5) {
      score += 50;
    } else if (result.samplingRatio >= 0.1 && result.samplingRatio <= 3.0) {
      score += 25;
    }
    
    const pixelScale = calculatePixelScale(setup.camera, setup.telescope);
    const theoreticalResolution = 138 / setup.telescope.apertureMM;
    if (pixelScale >= theoreticalResolution / 2 && pixelScale <= theoreticalResolution * 2) {
      score += 30;
    } else if (pixelScale >= theoreticalResolution / 3 && pixelScale <= theoreticalResolution * 3) {
      score += 15;
    }
    
    if (result.warnings.length === 0) {
      score += 20;
    } else if (result.warnings.length <= 2) {
      score += 10;
    }
    
    return {
      name: setup.name,
      result,
      score
    };
  });
  
  return comparisons.sort((a, b) => b.score - a.score);
}
