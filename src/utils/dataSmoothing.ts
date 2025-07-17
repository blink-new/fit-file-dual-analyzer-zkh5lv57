import { FitRecord } from '../types/fit';

/**
 * Data smoothing utilities for improving chart line quality
 */

export interface SmoothingOptions {
  windowSize?: number;
  method?: 'movingAverage' | 'exponential' | 'median';
}

/**
 * Apply smoothing to a specific metric in FIT records
 */
export function smoothMetricData(
  records: FitRecord[], 
  metric: keyof FitRecord, 
  options: SmoothingOptions = {}
): FitRecord[] {
  const { windowSize = 5, method = 'movingAverage' } = options;
  
  if (records.length === 0) return records;
  
  const smoothedRecords = [...records];
  
  // Extract values for the specific metric
  const values = records.map(record => record[metric] as number).filter(v => 
    v !== undefined && v !== null && !isNaN(v) && v > 0
  );
  
  if (values.length < windowSize) return records;
  
  // Apply smoothing based on method
  let smoothedValues: number[];
  
  switch (method) {
    case 'exponential':
      smoothedValues = exponentialSmoothing(values, 0.3);
      break;
    case 'median':
      smoothedValues = medianFilter(values, windowSize);
      break;
    case 'movingAverage':
    default:
      smoothedValues = movingAverage(values, windowSize);
      break;
  }
  
  // Apply smoothed values back to records
  let smoothedIndex = 0;
  for (let i = 0; i < smoothedRecords.length; i++) {
    const originalValue = smoothedRecords[i][metric] as number;
    if (originalValue !== undefined && originalValue !== null && !isNaN(originalValue) && originalValue > 0) {
      if (smoothedIndex < smoothedValues.length) {
        smoothedRecords[i] = {
          ...smoothedRecords[i],
          [metric]: smoothedValues[smoothedIndex]
        };
        smoothedIndex++;
      }
    }
  }
  
  return smoothedRecords;
}

/**
 * Moving average smoothing
 */
function movingAverage(values: number[], windowSize: number): number[] {
  const result: number[] = [];
  const halfWindow = Math.floor(windowSize / 2);
  
  for (let i = 0; i < values.length; i++) {
    const start = Math.max(0, i - halfWindow);
    const end = Math.min(values.length, i + halfWindow + 1);
    const window = values.slice(start, end);
    const average = window.reduce((sum, val) => sum + val, 0) / window.length;
    result.push(average);
  }
  
  return result;
}

/**
 * Exponential smoothing
 */
function exponentialSmoothing(values: number[], alpha: number): number[] {
  if (values.length === 0) return [];
  
  const result: number[] = [values[0]];
  
  for (let i = 1; i < values.length; i++) {
    const smoothed = alpha * values[i] + (1 - alpha) * result[i - 1];
    result.push(smoothed);
  }
  
  return result;
}

/**
 * Median filter for removing spikes
 */
function medianFilter(values: number[], windowSize: number): number[] {
  const result: number[] = [];
  const halfWindow = Math.floor(windowSize / 2);
  
  for (let i = 0; i < values.length; i++) {
    const start = Math.max(0, i - halfWindow);
    const end = Math.min(values.length, i + halfWindow + 1);
    const window = values.slice(start, end).sort((a, b) => a - b);
    const median = window[Math.floor(window.length / 2)];
    result.push(median);
  }
  
  return result;
}

/**
 * Remove outliers using IQR method
 */
export function removeOutliers(values: number[], metric: string): number[] {
  if (values.length < 4) return values;
  
  const sorted = [...values].sort((a, b) => a - b);
  const q1Index = Math.floor(sorted.length * 0.25);
  const q3Index = Math.floor(sorted.length * 0.75);
  const q1 = sorted[q1Index];
  const q3 = sorted[q3Index];
  const iqr = q3 - q1;
  
  // Define outlier bounds based on metric type
  let lowerBound = q1 - 1.5 * iqr;
  let upperBound = q3 + 1.5 * iqr;
  
  // Apply metric-specific bounds
  switch (metric) {
    case 'speed':
      lowerBound = Math.max(0, lowerBound);
      upperBound = Math.min(80, upperBound); // Max cycling speed
      break;
    case 'heart_rate':
      lowerBound = Math.max(40, lowerBound);
      upperBound = Math.min(220, upperBound); // Max theoretical HR
      break;
    case 'power':
      lowerBound = Math.max(0, lowerBound);
      upperBound = Math.min(2000, upperBound); // Max reasonable power
      break;
    case 'cadence':
      lowerBound = Math.max(0, lowerBound);
      upperBound = Math.min(200, upperBound); // Max reasonable cadence
      break;
  }
  
  return values.filter(value => value >= lowerBound && value <= upperBound);
}

/**
 * Apply comprehensive data cleaning to FIT records
 */
export function cleanFitData(records: FitRecord[]): FitRecord[] {
  if (records.length === 0) return records;
  
  let cleanedRecords = [...records];
  
  // Define metrics to clean and their smoothing preferences
  const metricsToClean: Array<{
    metric: keyof FitRecord;
    smoothing: SmoothingOptions;
  }> = [
    { metric: 'heart_rate', smoothing: { windowSize: 7, method: 'movingAverage' } },
    { metric: 'speed', smoothing: { windowSize: 5, method: 'median' } },
    { metric: 'power', smoothing: { windowSize: 3, method: 'movingAverage' } },
    { metric: 'cadence', smoothing: { windowSize: 5, method: 'movingAverage' } },
    { metric: 'altitude', smoothing: { windowSize: 9, method: 'movingAverage' } }
  ];
  
  // Apply smoothing to each metric
  for (const { metric, smoothing } of metricsToClean) {
    cleanedRecords = smoothMetricData(cleanedRecords, metric, smoothing);
  }
  
  return cleanedRecords;
}