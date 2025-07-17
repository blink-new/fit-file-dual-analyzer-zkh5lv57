import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { CombinedData } from '../types/fit';

interface StatisticsPanelProps {
  combinedData: CombinedData;
}

const metricLabels: { [key: string]: string } = {
  power: 'Power',
  heart_rate: 'Heart Rate',
  speed: 'Speed',
  cadence: 'Cadence',
  altitude: 'Elevation'
};

const metricUnits: { [key: string]: string } = {
  power: 'W',
  heart_rate: 'bpm',
  speed: 'km/h',
  cadence: 'rpm',
  altitude: 'm'
};

const metricColors: { [key: string]: string } = {
  power: 'bg-blue-100 text-blue-800',
  heart_rate: 'bg-red-100 text-red-800',
  speed: 'bg-green-100 text-green-800',
  cadence: 'bg-purple-100 text-purple-800',
  altitude: 'bg-orange-100 text-orange-800'
};

export function StatisticsPanel({ combinedData }: StatisticsPanelProps) {
  const { summary } = combinedData;
  
  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    }
    return `${minutes}m ${secs}s`;
  };

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Training Summary</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Duration */}
        <div className="flex justify-between items-center py-2 border-b">
          <span className="text-sm font-medium">Duration</span>
          <span className="text-sm text-muted-foreground">
            {formatDuration(summary.duration)}
          </span>
        </div>

        {/* Available Metrics */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Available Metrics</h4>
          <div className="flex flex-wrap gap-1">
            {summary.availableMetrics.map(metric => (
              <Badge 
                key={metric} 
                variant="secondary"
                className={metricColors[metric] || 'bg-gray-100 text-gray-800'}
              >
                {metricLabels[metric] || metric}
              </Badge>
            ))}
          </div>
        </div>

        {/* Statistics */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium">Statistics</h4>
          <div className="space-y-3">
            {summary.availableMetrics.map(metric => {
              const stats = summary.stats[metric];
              if (!stats) return null;

              return (
                <div key={metric} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-muted-foreground">
                      {metricLabels[metric] || metric}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {metricUnits[metric] || ''}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div className="text-center p-1 bg-muted rounded">
                      <div className="font-medium">{stats.avg}</div>
                      <div className="text-muted-foreground">AVG</div>
                    </div>
                    <div className="text-center p-1 bg-muted rounded">
                      <div className="font-medium">{stats.max}</div>
                      <div className="text-muted-foreground">MAX</div>
                    </div>
                    <div className="text-center p-1 bg-muted rounded">
                      <div className="font-medium">{stats.min}</div>
                      <div className="text-muted-foreground">MIN</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}