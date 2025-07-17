import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { CombinedData } from '../types/fit';
import { Activity, Zap, Heart, Gauge, Mountain } from 'lucide-react';

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
  power: 'bg-blue-50 text-blue-700 border-blue-200',
  heart_rate: 'bg-red-50 text-red-700 border-red-200',
  speed: 'bg-green-50 text-green-700 border-green-200',
  cadence: 'bg-purple-50 text-purple-700 border-purple-200',
  altitude: 'bg-orange-50 text-orange-700 border-orange-200'
};

const metricIcons: { [key: string]: React.ReactNode } = {
  power: <Zap className="w-4 h-4" />,
  heart_rate: <Heart className="w-4 h-4" />,
  speed: <Activity className="w-4 h-4" />,
  cadence: <Gauge className="w-4 h-4" />,
  altitude: <Mountain className="w-4 h-4" />
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

  const formatValue = (value: number, metric: string) => {
    switch (metric) {
      case 'speed':
        return value.toFixed(1);
      case 'power':
      case 'heart_rate':
      case 'cadence':
      case 'altitude':
        return Math.round(value).toString();
      default:
        return value.toString();
    }
  };

  return (
    <Card className="h-fit shadow-sm">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-semibold text-gray-900 flex items-center">
          <Activity className="w-5 h-5 mr-2 text-blue-600" />
          Training Summary
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Duration */}
        <div className="flex justify-between items-center py-3 px-4 bg-gray-50 rounded-lg">
          <span className="text-sm font-medium text-gray-700">Total Duration</span>
          <span className="text-sm font-semibold text-gray-900">
            {formatDuration(summary.duration)}
          </span>
        </div>

        {/* Available Metrics */}
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Available Metrics</h4>
          <div className="grid grid-cols-1 gap-2">
            {summary.availableMetrics.map(metric => (
              <div 
                key={metric}
                className={`flex items-center p-3 rounded-lg border ${metricColors[metric] || 'bg-gray-50 text-gray-700 border-gray-200'}`}
              >
                <div className="mr-3">
                  {metricIcons[metric] || <Activity className="w-4 h-4" />}
                </div>
                <div className="flex-1">
                  <div className="font-medium text-sm">
                    {metricLabels[metric] || metric}
                  </div>
                  <div className="text-xs opacity-75">
                    {metricUnits[metric] || ''}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Statistics */}
        <div className="space-y-4">
          <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Statistics</h4>
          <div className="space-y-4">
            {summary.availableMetrics.map(metric => {
              const stats = summary.stats[metric];
              if (!stats) return null;

              return (
                <div key={metric} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="text-gray-600">
                        {metricIcons[metric] || <Activity className="w-4 h-4" />}
                      </div>
                      <span className="text-sm font-medium text-gray-900">
                        {metricLabels[metric] || metric}
                      </span>
                    </div>
                    <span className="text-xs text-gray-500 font-medium">
                      {metricUnits[metric] || ''}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="text-center p-2 bg-blue-50 rounded-lg border border-blue-100">
                      <div className="font-semibold text-sm text-blue-900">
                        {stats.avg !== undefined ? formatValue(stats.avg, metric) : '-'}
                      </div>
                      <div className="text-xs text-blue-600 font-medium">AVG</div>
                    </div>
                    <div className="text-center p-2 bg-green-50 rounded-lg border border-green-100">
                      <div className="font-semibold text-sm text-green-900">
                        {stats.max !== undefined ? formatValue(stats.max, metric) : '-'}
                      </div>
                      <div className="text-xs text-green-600 font-medium">MAX</div>
                    </div>
                    <div className="text-center p-2 bg-orange-50 rounded-lg border border-orange-100">
                      <div className="font-semibold text-sm text-orange-900">
                        {stats.min !== undefined ? formatValue(stats.min, metric) : '-'}
                      </div>
                      <div className="text-xs text-orange-600 font-medium">MIN</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Data Quality Indicator */}
        <div className="pt-4 border-t border-gray-200">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>Data Points</span>
            <span className="font-medium">{combinedData.chartData.length.toLocaleString()}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}