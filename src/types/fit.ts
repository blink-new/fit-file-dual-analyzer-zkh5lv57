export interface FitRecord {
  timestamp: number;
  power?: number;
  heart_rate?: number;
  speed?: number; // m/s
  cadence?: number;
  altitude?: number;
  distance?: number;
  temperature?: number;
}

export interface ProcessedFitData {
  records: FitRecord[];
  summary: {
    duration: number;
    totalDistance?: number;
    avgPower?: number;
    maxPower?: number;
    avgHeartRate?: number;
    maxHeartRate?: number;
    avgSpeed?: number;
    maxSpeed?: number;
    avgCadence?: number;
    maxCadence?: number;
    elevationGain?: number;
    minAltitude?: number;
    maxAltitude?: number;
  };
  availableMetrics: string[];
}

export interface FileUploadState {
  file: File | null;
  data: ProcessedFitData | null;
  loading: boolean;
  error: string | null;
  fileName: string;
}

export interface ChartDataPoint {
  timestamp: number;
  time: string;
  power?: number;
  heart_rate?: number;
  speed?: number;
  cadence?: number;
  altitude?: number;
}

export interface CombinedData {
  chartData: ChartDataPoint[];
  summary: {
    duration: number;
    availableMetrics: string[];
    stats: {
      [key: string]: {
        avg?: number;
        max?: number;
        min?: number;
      };
    };
  };
}