import {
  CelestialCoordinates,
  ObserverLocation,
  calculateAltAz,
  calculateHourAngle
} from './coordinates';
import {
  calculateTargetVisibility,
  TargetVisibility,
  findOptimalObservingTime
} from './targetVisibility';
import {
  predictMeridianFlip,
  MountLimits
} from './meridianFlip';
import { DeepSkyObject } from '@/data/targets';

export interface ScheduleConstraints {
  minAltitude: number;
  maxAirmass: number;
  setupTimeMinutes: number;
  meridianFlipTimeMinutes: number;
  moonAvoidanceAngle: number;
  minimumSessionMinutes: number;
}

export interface TargetPriority {
  target: DeepSkyObject;
  priority: number;
  desiredExposureMinutes: number;
}

export interface ScheduledSession {
  target: DeepSkyObject;
  startTime: Date;
  endTime: Date;
  durationMinutes: number;
  maxAltitude: number;
  averageAirmass: number;
  meridianFlipRequired: boolean;
  flipTime: Date | null;
  score: number;
}

export interface SessionPlan {
  sessions: ScheduledSession[];
  totalImagingMinutes: number;
  totalSetupMinutes: number;
  efficiency: number;
  unscheduledTargets: DeepSkyObject[];
}

const DEFAULT_CONSTRAINTS: ScheduleConstraints = {
  minAltitude: 30,
  maxAirmass: 2.0,
  setupTimeMinutes: 10,
  meridianFlipTimeMinutes: 5,
  moonAvoidanceAngle: 30,
  minimumSessionMinutes: 30
};

export function calculateSessionScore(
  target: DeepSkyObject,
  startTime: Date,
  durationMinutes: number,
  location: ObserverLocation,
  priority: number
): number {
  let score = 0;
  
  const midTime = new Date(startTime.getTime() + (durationMinutes / 2) * 60000);
  const { altitude } = calculateAltAz(
    { ra: target.ra, dec: target.dec },
    location,
    midTime
  );
  
  score += altitude * 0.3;
  
  score += priority * 50;
  
  if (target.difficulty === 'Easy') score += 10;
  else if (target.difficulty === 'Moderate') score += 5;
  
  score += durationMinutes * 0.1;
  
  return score;
}

export function findBestTimeSlot(
  target: DeepSkyObject,
  location: ObserverLocation,
  date: Date,
  durationMinutes: number,
  occupiedSlots: Array<{ start: Date; end: Date }>,
  constraints: ScheduleConstraints = DEFAULT_CONSTRAINTS
): { start: Date; end: Date; score: number } | null {
  const visibility = calculateTargetVisibility(
    { ra: target.ra, dec: target.dec },
    location,
    date,
    15
  );
  
  if (visibility.neverRises || !visibility.bestObservingWindow) {
    return null;
  }
  
  const windowStart = visibility.bestObservingWindow.start;
  const windowEnd = visibility.bestObservingWindow.end;
  const availableMinutes = (windowEnd.getTime() - windowStart.getTime()) / 60000;
  
  if (availableMinutes < durationMinutes + constraints.minimumSessionMinutes) {
    return null;
  }
  
  let bestSlot: { start: Date; end: Date; score: number } | null = null;
  let bestScore = -Infinity;
  
  for (let offset = 0; offset <= availableMinutes - durationMinutes; offset += 15) {
    const slotStart = new Date(windowStart.getTime() + offset * 60000);
    const slotEnd = new Date(slotStart.getTime() + durationMinutes * 60000);
    
    const isOccupied = occupiedSlots.some(occupied =>
      (slotStart >= occupied.start && slotStart < occupied.end) ||
      (slotEnd > occupied.start && slotEnd <= occupied.end) ||
      (slotStart <= occupied.start && slotEnd >= occupied.end)
    );
    
    if (isOccupied) continue;
    
    if (slotEnd > windowEnd) continue;
    
    const score = calculateSessionScore(target, slotStart, durationMinutes, location, 1);
    
    if (score > bestScore) {
      bestScore = score;
      bestSlot = { start: slotStart, end: slotEnd, score };
    }
  }
  
  return bestSlot;
}

export function calculateAverageAirmass(
  target: DeepSkyObject,
  startTime: Date,
  endTime: Date,
  location: ObserverLocation
): number {
  const samples = 10;
  const durationMs = endTime.getTime() - startTime.getTime();
  const intervalMs = durationMs / samples;
  
  let totalAirmass = 0;
  
  for (let i = 0; i <= samples; i++) {
    const sampleTime = new Date(startTime.getTime() + i * intervalMs);
    const { altitude } = calculateAltAz(
      { ra: target.ra, dec: target.dec },
      location,
      sampleTime
    );
    
    if (altitude > 0) {
      const zenithAngle = 90 - altitude;
      const zenithRad = zenithAngle * Math.PI / 180;
      const airmass = 1 / (Math.cos(zenithRad) + 0.025 * Math.exp(-11 * Math.cos(zenithRad)));
      totalAirmass += airmass;
    }
  }
  
  return totalAirmass / (samples + 1);
}

export function scheduleSession(
  targets: TargetPriority[],
  location: ObserverLocation,
  date: Date,
  constraints: ScheduleConstraints = DEFAULT_CONSTRAINTS,
  mountLimits?: MountLimits
): SessionPlan {
  const sortedTargets = [...targets].sort((a, b) => b.priority - a.priority);
  
  const sessions: ScheduledSession[] = [];
  const occupiedSlots: Array<{ start: Date; end: Date }> = [];
  const unscheduledTargets: DeepSkyObject[] = [];
  
  for (const targetPriority of sortedTargets) {
    const target = targetPriority.target;
    const desiredDuration = targetPriority.desiredExposureMinutes;
    
    const bestSlot = findBestTimeSlot(
      target,
      location,
      date,
      desiredDuration,
      occupiedSlots,
      constraints
    );
    
    if (!bestSlot) {
      unscheduledTargets.push(target);
      continue;
    }
    
    const visibility = calculateTargetVisibility(
      { ra: target.ra, dec: target.dec },
      location,
      date,
      15
    );
    
    const flip = predictMeridianFlip(
      { ra: target.ra, dec: target.dec },
      location,
      bestSlot.start,
      mountLimits
    );
    
    const meridianFlipRequired = flip.flipTime !== null &&
      flip.flipTime >= bestSlot.start &&
      flip.flipTime <= bestSlot.end;
    
    const averageAirmass = calculateAverageAirmass(
      target,
      bestSlot.start,
      bestSlot.end,
      location
    );
    
    const session: ScheduledSession = {
      target,
      startTime: bestSlot.start,
      endTime: bestSlot.end,
      durationMinutes: desiredDuration,
      maxAltitude: visibility.bestObservingWindow?.maxAltitude || 0,
      averageAirmass,
      meridianFlipRequired,
      flipTime: meridianFlipRequired ? flip.flipTime : null,
      score: bestSlot.score
    };
    
    sessions.push(session);
    occupiedSlots.push({ start: bestSlot.start, end: bestSlot.end });
    
    if (meridianFlipRequired) {
      occupiedSlots.push({
        start: flip.flipTime!,
        end: new Date(flip.flipTime!.getTime() + constraints.meridianFlipTimeMinutes * 60000)
      });
    }
    
    occupiedSlots.push({
      start: new Date(bestSlot.end.getTime()),
      end: new Date(bestSlot.end.getTime() + constraints.setupTimeMinutes * 60000)
    });
  }
  
  sessions.sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
  
  const totalImagingMinutes = sessions.reduce((sum, s) => sum + s.durationMinutes, 0);
  const totalSetupMinutes = sessions.length * constraints.setupTimeMinutes;
  const totalFlipMinutes = sessions.filter(s => s.meridianFlipRequired).length * constraints.meridianFlipTimeMinutes;
  
  const nightDuration = 12 * 60;
  const efficiency = (totalImagingMinutes / (totalImagingMinutes + totalSetupMinutes + totalFlipMinutes)) * 100;
  
  return {
    sessions,
    totalImagingMinutes,
    totalSetupMinutes,
    efficiency,
    unscheduledTargets
  };
}

export function optimizeSchedule(
  targets: TargetPriority[],
  location: ObserverLocation,
  date: Date,
  constraints: ScheduleConstraints = DEFAULT_CONSTRAINTS,
  iterations: number = 100
): SessionPlan {
  let bestPlan = scheduleSession(targets, location, date, constraints);
  let bestScore = bestPlan.sessions.reduce((sum, s) => sum + s.score, 0);
  
  for (let i = 0; i < iterations; i++) {
    const shuffled = [...targets].sort(() => Math.random() - 0.5);
    
    const plan = scheduleSession(shuffled, location, date, constraints);
    const score = plan.sessions.reduce((sum, s) => sum + s.score, 0);
    
    if (score > bestScore) {
      bestScore = score;
      bestPlan = plan;
    }
  }
  
  return bestPlan;
}

export function generateTimelineData(
  plan: SessionPlan,
  location: ObserverLocation,
  date: Date
): Array<{ time: Date; type: 'imaging' | 'setup' | 'flip' | 'idle'; target?: DeepSkyObject }> {
  const timeline: Array<{ time: Date; type: 'imaging' | 'setup' | 'flip' | 'idle'; target?: DeepSkyObject }> = [];
  
  const visibility = calculateTargetVisibility(
    { ra: 0, dec: location.latitude },
    location,
    date,
    15
  );
  
  const nightStart = visibility.darkTimeWindow.start;
  const nightEnd = visibility.darkTimeWindow.end;
  
  let currentTime = nightStart;
  
  for (const session of plan.sessions) {
    if (session.startTime > currentTime) {
      timeline.push({
        time: currentTime,
        type: 'idle'
      });
    }
    
    timeline.push({
      time: session.startTime,
      type: 'imaging',
      target: session.target
    });
    
    if (session.meridianFlipRequired && session.flipTime) {
      timeline.push({
        time: session.flipTime,
        type: 'flip',
        target: session.target
      });
    }
    
    timeline.push({
      time: session.endTime,
      type: 'setup'
    });
    
    currentTime = new Date(session.endTime.getTime() + 10 * 60000);
  }
  
  if (currentTime < nightEnd) {
    timeline.push({
      time: currentTime,
      type: 'idle'
    });
  }
  
  return timeline;
}
