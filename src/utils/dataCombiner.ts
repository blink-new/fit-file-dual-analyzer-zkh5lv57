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

  // Get time range
  const startTime = allRecords[0].timestamp;
  const endTime = allRecords[allRecords.length - 1].timestamp;
  const duration = (endTime - startTime) / 1000; // seconds

  // Combine available metrics from both files
  const availableMetrics = Array.from(new Set([
    ...(file1Data?.availableMetrics || []),
    ...(file2Data?.availableMetrics || [])
  ]));

  // Create time-aligned data points with unified time axis
  const chartData: ChartDataPoint[] = [];
  // Use smaller time step for better synchronization (1 second intervals)
  const timeStep = 1000; // 1 second intervals for precise alignment
  const maxPoints = 3600; // Limit to 1 hour of data at 1-second intervals
  const actualTimeStep = duration > maxPoints ? Math.floor(duration * 1000 / maxPoints) : timeStep;

  // Create data points for the entire duration range to ensure alignment
  for (let time = startTime; time <= endTime; time += actualTimeStep) {
    const dataPoint: ChartDataPoint = {
      timestamp: time,
      time: formatTime((time - startTime) / 1000)
    };

    // Initialize all metrics as undefined to ensure consistent structure
    availableMetrics.forEach(metric => {
      dataPoint[metric as keyof ChartDataPoint] = undefined;
    });

    // Find the closest records from both files for this timestamp
    const closestRecords = findClosestRecords(allRecords, time);
    
    // Merge data from closest records with interpolation for smoother curves
    const interpolatedData = interpolateDataPoint(allRecords, time);
    
    // Use interpolated values if available, otherwise use closest records
    availableMetrics.forEach(metric => {
      if (interpolatedData[metric] !== undefined && interpolatedData[metric] >= 0) {
        dataPoint[metric as keyof ChartDataPoint] = interpolatedData[metric];
      } else {
        // Fallback to closest record
        const recordWithMetric = closestRecords.find(record => 
          record[metric] !== undefined && record[metric] >= 0
        );
        if (recordWithMetric && recordWithMetric[metric] !== undefined) {
          dataPoint[metric as keyof ChartDataPoint] = recordWithMetric[metric];
        }
      }
    });

    chartData.push(dataPoint);
  }

  // Ensure all charts have the same data length by filling gaps
  // This guarantees perfect alignment across all charts
  const completeChartData = chartData.map(point => {
    const completePoint = { ...point };
    availableMetrics.forEach(metric => {
      if (completePoint[metric as keyof ChartDataPoint] === undefined) {
        completePoint[metric as keyof ChartDataPoint] = null;
      }
    });
    return completePoint;
  });

  // Calculate combined statistics with proper filtering
  const stats: { [key: string]: { avg?: number; max?: number; min?: number } } = {};
  
  availableMetrics.forEach(metric => {
    const values = completeChartData
      .map(point => point[metric as keyof ChartDataPoint] as number)
      .filter(v => v !== undefined && v !== null && !isNaN(v) && v >= 0);

    if (values.length > 0) {
      const sum = values.reduce((a, b) => a + b, 0);
      const avg = sum / values.length;
      const max = Math.max(...values);
      const min = Math.min(...values);

      // Round based on metric type for better display
      const precision = getMetricPrecision(metric);
      stats[metric] = {
        avg: Math.round(avg * precision) / precision,
        max: Math.round(max * precision) / precision,
        min: Math.round(min * precision) / precision
      };
    }
  });

  return {
    chartData: completeChartData,
    summary: {
      duration,
      availableMetrics,
      stats
    }
  };
}

function interpolateDataPoint(records: any[], targetTime: number): { [key: string]: number } {
  const result: { [key: string]: number } = {};
  
  // Find records before and after target time
  const beforeRecord = records
    .filter(r => r.timestamp <= targetTime)
    .sort((a, b) => b.timestamp - a.timestamp)[0];
    
  const afterRecord = records
    .filter(r => r.timestamp >= targetTime)
    .sort((a, b) => a.timestamp - b.timestamp)[0];

  if (!beforeRecord || !afterRecord || beforeRecord.timestamp === afterRecord.timestamp) {
    // No interpolation possible, return closest record
    const closest = beforeRecord || afterRecord;
    if (closest) {
      ['power', 'heart_rate', 'speed', 'cadence', 'altitude'].forEach(metric => {
        if (closest[metric] !== undefined && closest[metric] >= 0) {
          result[metric] = closest[metric];
        }
      });
    }
    return result;
  }

  // Linear interpolation
  const timeDiff = afterRecord.timestamp - beforeRecord.timestamp;
  const timeRatio = (targetTime - beforeRecord.timestamp) / timeDiff;

  ['power', 'heart_rate', 'speed', 'cadence', 'altitude'].forEach(metric => {
    const beforeValue = beforeRecord[metric];
    const afterValue = afterRecord[metric];
    
    if (beforeValue !== undefined && afterValue !== undefined && 
        beforeValue >= 0 && afterValue >= 0) {
      result[metric] = beforeValue + (afterValue - beforeValue) * timeRatio;
    } else if (beforeValue !== undefined && beforeValue >= 0) {
      result[metric] = beforeValue;
    } else if (afterValue !== undefined && afterValue >= 0) {
      result[metric] = afterValue;
    }
  });

  return result;
}

function findClosestRecords(records: any[], targetTime: number, maxDistance = 5000) {
  const closeRecords = records.filter(record => 
    Math.abs(record.timestamp - targetTime) <= maxDistance
  );

  // Sort by distance to target time and return the closest ones
  return closeRecords
    .sort((a, b) => Math.abs(a.timestamp - targetTime) - Math.abs(b.timestamp - targetTime))
    .slice(0, 2); // Take up to 2 closest records for better precision
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