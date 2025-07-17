import React, { useState } from 'react';
import { Button } from './ui/button';
import { ArrowLeft } from 'lucide-react';
import { MetricChart } from './MetricChart';
import { StatisticsPanel } from './StatisticsPanel';
import { CombinedData } from '../types/fit';

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

  const { chartData, summary } = combinedData;

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

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-white">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Training Analysis</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Combined data from your FIT files
              </p>
            </div>
            <Button variant="outline" onClick={onNewUpload}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              New Upload
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Charts */}
          <div className="lg:col-span-3 space-y-4">
            <div className="grid gap-4">
              {summary.availableMetrics.map(metric => (
                <MetricChart
                  key={metric}
                  data={chartData}
                  metric={metric}
                  color={metricColors[metric] || '#6B7280'}
                  unit=""
                  hoverTime={hoverTime}
                  onHover={setHoverTime}
                />
              ))}
            </div>
          </div>

          {/* Statistics Panel */}
          <div className="lg:col-span-1">
            <StatisticsPanel combinedData={combinedData} />
          </div>
        </div>
      </div>
    </div>
  );
}