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

  // Create time-aligned data points
  const chartData: ChartDataPoint[] = [];
  const timeStep = 1000; // 1 second intervals

  for (let time = startTime; time <= endTime; time += timeStep) {
    const dataPoint: ChartDataPoint = {
      timestamp: time,
      time: formatTime((time - startTime) / 1000)
    };

    // Find the closest records from both files for this timestamp
    const closestRecords = findClosestRecords(allRecords, time);
    
    // Merge data from closest records
    closestRecords.forEach(record => {
      if (record.power !== undefined) dataPoint.power = record.power;
      if (record.heart_rate !== undefined) dataPoint.heart_rate = record.heart_rate;
      if (record.speed !== undefined) dataPoint.speed = record.speed;
      if (record.cadence !== undefined) dataPoint.cadence = record.cadence;
      if (record.altitude !== undefined) dataPoint.altitude = record.altitude;
    });

    chartData.push(dataPoint);
  }

  // Calculate combined statistics
  const stats: { [key: string]: { avg?: number; max?: number; min?: number } } = {};
  
  availableMetrics.forEach(metric => {
    const values = chartData
      .map(point => point[metric as keyof ChartDataPoint] as number)
      .filter(v => v !== undefined && v !== null && !isNaN(v));

    if (values.length > 0) {
      const sum = values.reduce((a, b) => a + b, 0);
      const avg = sum / values.length;
      const max = Math.max(...values);
      const min = Math.min(...values);

      stats[metric] = {
        avg: Math.round(avg * 10) / 10,
        max: Math.round(max * 10) / 10,
        min: Math.round(min * 10) / 10
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

function findClosestRecords(records: any[], targetTime: number, maxDistance = 5000) {
  const closeRecords = records.filter(record => 
    Math.abs(record.timestamp - targetTime) <= maxDistance
  );

  // Sort by distance to target time and return the closest ones
  return closeRecords
    .sort((a, b) => Math.abs(a.timestamp - targetTime) - Math.abs(b.timestamp - targetTime))
    .slice(0, 2); // Take up to 2 closest records
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