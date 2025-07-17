import FitParser from 'fit-file-parser';
import { ProcessedFitData, FitRecord } from '../types/fit';

export class FitFileProcessor {
  private parser: FitParser;

  constructor() {
    this.parser = new FitParser({
      force: true,
      speedUnit: 'km/h',
      lengthUnit: 'm',
      temperatureUnit: 'celsius',
      elapsedRecordField: true,
      mode: 'list'
    });
  }

  async processFile(file: File): Promise<ProcessedFitData> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (event) => {
        try {
          const arrayBuffer = event.target?.result as ArrayBuffer;
          const uint8Array = new Uint8Array(arrayBuffer);
          
          this.parser.parse(uint8Array, (error: any, data: any) => {
            if (error) {
              reject(new Error(`Failed to parse FIT file: ${error.message}`));
              return;
            }

            try {
              const processedData = this.extractData(data);
              resolve(processedData);
            } catch (processingError) {
              reject(new Error(`Failed to process FIT data: ${processingError}`));
            }
          });
        } catch (error) {
          reject(new Error(`Failed to read file: ${error}`));
        }
      };

      reader.onerror = () => {
        reject(new Error('Failed to read file'));
      };

      reader.readAsArrayBuffer(file);
    });
  }

  private extractData(fitData: any): ProcessedFitData {
    const records: FitRecord[] = [];
    const availableMetrics: Set<string> = new Set();

    // Extract records from the FIT data
    if (fitData.records) {
      for (const record of fitData.records) {
        if (record.timestamp) {
          const fitRecord: FitRecord = {
            timestamp: new Date(record.timestamp).getTime()
          };

          // Extract available metrics - show data as-is from FIT file
          if (record.power !== undefined && record.power !== null && record.power >= 0) {
            fitRecord.power = record.power;
            availableMetrics.add('power');
          }

          if (record.heart_rate !== undefined && record.heart_rate !== null && record.heart_rate > 0) {
            fitRecord.heart_rate = record.heart_rate;
            availableMetrics.add('heart_rate');
          }

          if (record.speed !== undefined && record.speed !== null && record.speed >= 0) {
            // FIT parser already handles unit conversion based on speedUnit config
            // Show the data as provided by the parser
            fitRecord.speed = record.speed;
            availableMetrics.add('speed');
          }

          if (record.cadence !== undefined && record.cadence !== null && record.cadence >= 0) {
            fitRecord.cadence = record.cadence;
            availableMetrics.add('cadence');
          }

          if (record.altitude !== undefined && record.altitude !== null) {
            fitRecord.altitude = record.altitude;
            availableMetrics.add('altitude');
          }

          if (record.distance !== undefined && record.distance !== null) {
            fitRecord.distance = record.distance;
          }

          if (record.temperature !== undefined && record.temperature !== null) {
            fitRecord.temperature = record.temperature;
          }

          records.push(fitRecord);
        }
      }
    }

    // Validate that we have at least one metric
    if (availableMetrics.size === 0) {
      throw new Error('No valid training data found in FIT file. File must contain at least one of: power, heart rate, speed, cadence, or elevation data.');
    }

    // Calculate summary statistics
    const summary = this.calculateSummary(records, Array.from(availableMetrics));

    return {
      records,
      summary,
      availableMetrics: Array.from(availableMetrics)
    };
  }

  private calculateSummary(records: FitRecord[], metrics: string[]) {
    if (records.length === 0) {
      return {
        duration: 0,
        totalDistance: 0,
        avgPower: 0,
        maxPower: 0,
        avgHeartRate: 0,
        maxHeartRate: 0,
        avgSpeed: 0,
        maxSpeed: 0,
        avgCadence: 0,
        maxCadence: 0,
        elevationGain: 0,
        minAltitude: 0,
        maxAltitude: 0
      };
    }

    const firstTimestamp = records[0].timestamp;
    const lastTimestamp = records[records.length - 1].timestamp;
    const duration = (lastTimestamp - firstTimestamp) / 1000; // seconds

    const summary: any = { duration };

    // Calculate stats for each available metric
    metrics.forEach(metric => {
      const values = records
        .map(r => r[metric as keyof FitRecord] as number)
        .filter(v => v !== undefined && v !== null && !isNaN(v));

      if (values.length > 0) {
        const sum = values.reduce((a, b) => a + b, 0);
        const avg = sum / values.length;
        const max = Math.max(...values);
        const min = Math.min(...values);

        switch (metric) {
          case 'power': {
            summary.avgPower = Math.round(avg);
            summary.maxPower = Math.round(max);
            break;
          }
          case 'heart_rate': {
            summary.avgHeartRate = Math.round(avg);
            summary.maxHeartRate = Math.round(max);
            break;
          }
          case 'speed': {
            summary.avgSpeed = Math.round(avg * 10) / 10;
            summary.maxSpeed = Math.round(max * 10) / 10;
            break;
          }
          case 'cadence': {
            summary.avgCadence = Math.round(avg);
            summary.maxCadence = Math.round(max);
            break;
          }
          case 'altitude': {
            summary.minAltitude = Math.round(min);
            summary.maxAltitude = Math.round(max);
            // Calculate elevation gain
            let elevationGain = 0;
            for (let i = 1; i < records.length; i++) {
              const prev = records[i - 1].altitude;
              const curr = records[i].altitude;
              if (prev !== undefined && curr !== undefined && curr > prev) {
                elevationGain += curr - prev;
              }
            }
            summary.elevationGain = Math.round(elevationGain);
            break;
          }
        }
      }
    });

    // Calculate total distance if available
    const lastRecord = records[records.length - 1];
    if (lastRecord.distance !== undefined) {
      summary.totalDistance = Math.round(lastRecord.distance / 1000 * 100) / 100; // km
    }

    return summary;
  }
}

export const fitProcessor = new FitFileProcessor();