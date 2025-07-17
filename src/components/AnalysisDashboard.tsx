import React, { useState, useMemo } from 'react';
import { Button } from './ui/button';
import { ArrowLeft, ChevronRight, ChevronLeft, BarChart3 } from 'lucide-react';
import { MetricChart } from './MetricChart';
import { StatisticsPanel } from './StatisticsPanel';
import { CombinedData } from '../types/fit';
import { cn } from '../lib/utils';

interface AnalysisDashboardProps {
  combinedData: CombinedData;
  onNewUpload: () => void;
}

const metricColors: { [key: string]: string } = {
  power: '#2563EB',
  heart_rate: '#EF4444',
  speed: '#22C55E',
  cadence: '#A855F7',
  altitude: '#F59E0B'
};

export function AnalysisDashboard({ combinedData, onNewUpload }: AnalysisDashboardProps) {
  const [hoverTime, setHoverTime] = useState<number | null>(null);
  const [statisticsPanelCollapsed, setStatisticsPanelCollapsed] = useState(false);

  const { chartData, summary } = combinedData;

  // Ensure EXACT time domain alignment for all charts
  const timeDomain: [number, number] = useMemo(() => {
    if (chartData.length === 0) return [0, 0];
    // Use first and last timestamps to ensure all charts have identical time range
    return [chartData[0].timestamp, chartData[chartData.length - 1].timestamp];
  }, [chartData]);

  if (chartData.length === 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <h2 className="text-xl font-semibold">No data to display</h2>
          <p className="text-muted-foreground">Please upload valid FIT files to see the analysis.</p>
          <Button onClick={onNewUpload}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Upload
          </Button>
        </div>
      </div>
    );
  }

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m ${secs}s`;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="border-b bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Training Analysis</h1>
                <div className="flex items-center space-x-4 mt-1">
                  <p className="text-sm text-gray-600">
                    Duration: <span className="font-medium">{formatDuration(summary.duration)}</span>
                  </p>
                  <p className="text-sm text-gray-600">
                    Metrics: <span className="font-medium">{summary.availableMetrics.length}</span>
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setStatisticsPanelCollapsed(!statisticsPanelCollapsed)}
                className="lg:hidden"
              >
                <BarChart3 className="w-4 h-4 mr-2" />
                Stats
              </Button>
              <Button variant="outline" onClick={onNewUpload}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                New Upload
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex gap-6">
          {/* Charts Section */}
          <div className={cn(
            "transition-all duration-300 ease-in-out",
            statisticsPanelCollapsed ? "flex-1" : "flex-1 lg:flex-[3]"
          )}>
            <div className="space-y-4">
              {summary.availableMetrics.map(metric => (
                <MetricChart
                  key={metric}
                  data={chartData}
                  metric={metric}
                  color={metricColors[metric] || '#6B7280'}
                  unit=""
                  timeDomain={timeDomain}
                  hoverTime={hoverTime}
                  onHover={setHoverTime}
                />
              ))}
            </div>
          </div>

          {/* Statistics Panel */}
          <div className={cn(
            "transition-all duration-300 ease-in-out",
            "hidden lg:block relative",
            statisticsPanelCollapsed ? "w-0 overflow-visible" : "w-80 flex-shrink-0"
          )}>
            <div className="sticky top-6">
              <div className="relative">
                {/* Collapse/Expand Button - Always visible */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setStatisticsPanelCollapsed(!statisticsPanelCollapsed)}
                  className={cn(
                    "absolute top-4 z-20 h-8 w-8 p-0 bg-white border shadow-sm hover:bg-gray-50",
                    statisticsPanelCollapsed ? "-right-10" : "-left-10"
                  )}
                  title={statisticsPanelCollapsed ? "Show Statistics" : "Hide Statistics"}
                >
                  {statisticsPanelCollapsed ? (
                    <ChevronLeft className="w-4 h-4" />
                  ) : (
                    <ChevronRight className="w-4 h-4" />
                  )}
                </Button>
                
                {!statisticsPanelCollapsed && (
                  <StatisticsPanel combinedData={combinedData} />
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Statistics Panel */}
        {statisticsPanelCollapsed && (
          <div className="lg:hidden mt-6">
            <StatisticsPanel combinedData={combinedData} />
          </div>
        )}
      </div>

      {/* Synchronized Hover Data Display */}
      {hoverTime && (
        <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white px-4 py-3 rounded-lg text-sm font-medium shadow-lg border border-gray-700 max-w-sm z-50">
          <div className="text-center text-gray-300 text-xs mb-2">
            Time: {new Date(hoverTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </div>
          <div className="grid grid-cols-1 gap-1">
            {summary.availableMetrics.map(metric => {
              // Find the exact data point at hover time - guaranteed to exist due to unified timestamps
              const dataPoint = chartData.find(d => d.timestamp === hoverTime);
              const value = dataPoint?.[metric as keyof ChartDataPoint] as number;
              const unit = {
                power: 'W',
                heart_rate: 'bpm',
                speed: 'km/h',
                cadence: 'rpm',
                altitude: 'm'
              }[metric] || '';
              
              return (
                <div key={metric} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div 
                      className="w-2 h-2 rounded-full" 
                      style={{ backgroundColor: metricColors[metric] || '#6B7280' }}
                    />
                    <span className="text-xs">
                      {{
                        power: 'Power',
                        heart_rate: 'HR',
                        speed: 'Speed',
                        cadence: 'Cadence',
                        altitude: 'Elevation'
                      }[metric] || metric}:
                    </span>
                  </div>
                  <span className="text-xs font-medium">
                    {value !== null && value !== undefined && !isNaN(value) 
                      ? `${metric === 'speed' ? value.toFixed(1) : Math.round(value)} ${unit}`
                      : '—'
                    }
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
