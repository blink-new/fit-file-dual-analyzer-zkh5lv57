import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, ReferenceLine } from 'recharts';
import { ChartDataPoint } from '../types/fit';

interface MetricChartProps {
  data: ChartDataPoint[];
  metric: string;
  color: string;
  unit: string;
  hoverTime?: number;
  onHover?: (time: number | null) => void;
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

export function MetricChart({ data, metric, color, hoverTime, onHover }: MetricChartProps) {
  const filteredData = data.filter(point => point[metric as keyof ChartDataPoint] !== undefined);
  
  if (filteredData.length === 0) {
    return null;
  }

  const values = filteredData.map(point => point[metric as keyof ChartDataPoint] as number);
  const minValue = Math.min(...values);
  const maxValue = Math.max(...values);
  const padding = (maxValue - minValue) * 0.1;

  const handleMouseMove = (e: any) => {
    if (e && e.activeLabel) {
      const timeString = e.activeLabel;
      // Convert time string back to timestamp for synchronization
      const dataPoint = data.find(d => d.time === timeString);
      if (dataPoint && onHover) {
        onHover(dataPoint.timestamp);
      }
    }
  };

  const handleMouseLeave = () => {
    if (onHover) {
      onHover(null);
    }
  };

  return (
    <div className="bg-white rounded-lg border p-4 h-48">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-medium text-gray-900">
          {metricLabels[metric] || metric}
        </h3>
        <span className="text-xs text-gray-500">
          {metricUnits[metric] || ''}
        </span>
      </div>
      
      <div className="h-36">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={filteredData}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            margin={{ top: 5, right: 5, left: 5, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis 
              dataKey="time" 
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 10, fill: '#666' }}
              interval="preserveStartEnd"
            />
            <YAxis 
              domain={[minValue - padding, maxValue + padding]}
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 10, fill: '#666' }}
              width={35}
            />
            <Line
              type="monotone"
              dataKey={metric}
              stroke={color}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 3, stroke: color, strokeWidth: 2, fill: 'white' }}
            />
            {hoverTime && (
              <ReferenceLine 
                x={data.find(d => d.timestamp === hoverTime)?.time} 
                stroke="#666" 
                strokeDasharray="2 2"
                strokeWidth={1}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}