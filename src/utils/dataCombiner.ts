import { ProcessedFitData, ChartDataPoint, CombinedData } from '../types/fit';

export function combineFileData(file1Data: ProcessedFitData | null, file2Data: ProcessedFitData | null): CombinedData {
  if (!file1Data && !file2Data) {
    return {
      chartData: [],
      summary: {
        duration: 0,
        availableMetrics: [],
        stats: {}
      }
    };
  }

  // Get all records from both files
  const allRecords = [
    ...(file1Data?.records || []),
    ...(file2Data?.records || [])
  ];

  if (allRecords.length === 0) {
    return {
      chartData: [],
      summary: {
        duration: 0,
        availableMetrics: [],
        stats: {}
      }
    };
  }

  // Sort by timestamp
  allRecords.sort((a, b) => a.timestamp - b.timestamp);

  // Get ABSOLUTE time range - this ensures ALL charts start and end at the same time
  const startTime = allRecords[0].timestamp;
  const endTime = allRecords[allRecords.length - 1].timestamp;
  const duration = (endTime - startTime) / 1000; // seconds

  // Combine available metrics from both files
  const availableMetrics = Array.from(new Set([
    ...(file1Data?.availableMetrics || []),
    ...(file2Data?.availableMetrics || [])
  ]));

  // Create UNIFIED time axis - every chart will have exactly the same timestamps
  const timeStep = Math.max(1000, Math.floor(duration * 1000 / 2000)); // Max 2000 points, min 1 second
  const unifiedTimestamps: number[] = [];
  
  for (let time = startTime; time <= endTime; time += timeStep) {
    unifiedTimestamps.push(time);
  }
  
  // Ensure we always include the exact end time
  if (unifiedTimestamps[unifiedTimestamps.length - 1] !== endTime) {
    unifiedTimestamps.push(endTime);
  }

  // Create chart data with IDENTICAL timestamps for ALL metrics
  const chartData: ChartDataPoint[] = unifiedTimestamps.map(timestamp => {
    const dataPoint: ChartDataPoint = {
      timestamp,
      time: formatTime((timestamp - startTime) / 1000)
    };

    // For each metric, find the best value at this exact timestamp
    availableMetrics.forEach(metric => {
      const value = getValueAtTimestamp(allRecords, timestamp, metric);
      dataPoint[metric as keyof ChartDataPoint] = value;
    });

    return dataPoint;
  });

  // Calculate statistics
  const stats: { [key: string]: { avg?: number; max?: number; min?: number } } = {};
  
  availableMetrics.forEach(metric => {
    const values = chartData
      .map(point => point[metric as keyof ChartDataPoint] as number)
      .filter(v => v !== undefined && v !== null && !isNaN(v) && v >= 0);

    if (values.length > 0) {
      const sum = values.reduce((a, b) => a + b, 0);
      const avg = sum / values.length;
      const max = Math.max(...values);
      const min = Math.min(...values);

      const precision = getMetricPrecision(metric);
      stats[metric] = {
        avg: Math.round(avg * precision) / precision,
        max: Math.round(max * precision) / precision,
        min: Math.round(min * precision) / precision
      };
    }
  });

  return {
    chartData,
    summary: {
      duration,
      availableMetrics,
      stats
    }
  };
}

/**
 * Get the best value for a metric at a specific timestamp using intelligent interpolation
 */
function getValueAtTimestamp(records: any[], targetTime: number, metric: string): number | null {
  // Find records with this metric around the target time
  const recordsWithMetric = records.filter(r => 
    r[metric] !== undefined && 
    r[metric] !== null && 
    !isNaN(r[metric]) && 
    r[metric] >= 0
  );

  if (recordsWithMetric.length === 0) {
    return null;
  }

  // Find exact match first
  const exactMatch = recordsWithMetric.find(r => r.timestamp === targetTime);
  if (exactMatch) {
    return exactMatch[metric];
  }

  // Find the closest records before and after
  const beforeRecords = recordsWithMetric
    .filter(r => r.timestamp <= targetTime)
    .sort((a, b) => b.timestamp - a.timestamp);
    
  const afterRecords = recordsWithMetric
    .filter(r => r.timestamp >= targetTime)
    .sort((a, b) => a.timestamp - b.timestamp);

  const beforeRecord = beforeRecords[0];
  const afterRecord = afterRecords[0];

  // If we only have one side, use the closest record within reasonable distance
  const maxDistance = 30000; // 30 seconds max distance
  
  if (!beforeRecord && afterRecord) {
    if (Math.abs(afterRecord.timestamp - targetTime) <= maxDistance) {
      return afterRecord[metric];
    }
    return null;
  }
  
  if (!afterRecord && beforeRecord) {
    if (Math.abs(beforeRecord.timestamp - targetTime) <= maxDistance) {
      return beforeRecord[metric];
    }
    return null;
  }

  if (!beforeRecord || !afterRecord) {
    return null;
  }

  // Check if records are too far apart for reliable interpolation
  const timeDiff = afterRecord.timestamp - beforeRecord.timestamp;
  if (timeDiff > maxDistance) {
    // Use the closer record
    const beforeDist = Math.abs(targetTime - beforeRecord.timestamp);
    const afterDist = Math.abs(targetTime - afterRecord.timestamp);
    return beforeDist <= afterDist ? beforeRecord[metric] : afterRecord[metric];
  }

  // Linear interpolation for smooth curves
  const timeRatio = (targetTime - beforeRecord.timestamp) / timeDiff;
  const beforeValue = beforeRecord[metric];
  const afterValue = afterRecord[metric];
  
  return beforeValue + (afterValue - beforeValue) * timeRatio;
}

function getMetricPrecision(metric: string): number {
  switch (metric) {
    case 'speed':
      return 10; // 1 decimal place
    case 'power':
    case 'heart_rate':
    case 'cadence':
    case 'altitude':
      return 1; // No decimal places
    default:
      return 10; // 1 decimal place by default
  }
}

function formatTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}