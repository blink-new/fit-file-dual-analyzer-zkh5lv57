import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, ReferenceLine, Tooltip } from 'recharts';
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
  // Use all data points to maintain time alignment, but filter for calculations
  const validData = data.filter(point => {
    const value = point[metric as keyof ChartDataPoint] as number;
    return value !== undefined && value !== null && !isNaN(value) && value > 0;
  });
  
  if (validData.length === 0) {
    return null;
  }

  // Use complete data for chart to maintain alignment, but calculate domain from valid data
  const chartData = data;

  // Calculate proper Y-axis domain with smart scaling
  const values = validData.map(point => point[metric as keyof ChartDataPoint] as number);
  const minValue = Math.min(...values);
  const maxValue = Math.max(...values);
  
  // Smart padding based on metric type and value range
  const range = maxValue - minValue;
  let padding: number;
  
  if (range === 0) {
    // Single value case
    padding = Math.max(maxValue * 0.1, 1);
  } else if (range < 10) {
    // Small range - use fixed padding
    padding = 2;
  } else {
    // Normal range - use percentage padding
    padding = range * 0.1;
  }

  // Calculate domain with proper bounds
  const yMin = Math.max(0, minValue - padding);
  const yMax = maxValue + padding;

  // Format Y-axis ticks based on metric type
  const formatYTick = (value: number) => {
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

  // Calculate tick interval for Y-axis
  const getYTickCount = () => {
    const range = yMax - yMin;
    if (range <= 10) return 5;
    if (range <= 50) return 6;
    if (range <= 200) return 8;
    return 10;
  };

  const handleMouseMove = (e: any) => {
    if (e && e.activeLabel) {
      const timeString = e.activeLabel;
      // Find the corresponding data point to get the exact timestamp
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

  // Find the hover line position
  const hoverTimeString = hoverTime ? data.find(d => d.timestamp === hoverTime)?.time : null;

  // Custom tooltip component
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length > 0) {
      const value = payload[0].value;
      if (value !== null && value !== undefined && !isNaN(value) && value > 0) {
        return (
          <div className="bg-gray-900 text-white px-3 py-2 rounded-lg shadow-lg text-sm font-medium border border-gray-700">
            <div className="flex items-center space-x-2">
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: color }}
              />
              <span>{metricLabels[metric]}: {formatYTick(value)} {metricUnits[metric]}</span>
            </div>
            <div className="text-gray-300 text-xs mt-1">
              Time: {label}
            </div>
          </div>
        );
      }
    }
    return null;
  };

  return (
    <div className="bg-white rounded-lg border shadow-sm">
      {/* Chart Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b bg-gray-50/50">
        <h3 className="text-sm font-semibold text-gray-900">
          {metricLabels[metric] || metric}
        </h3>
        <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded">
          {metricUnits[metric] || ''}
        </span>
      </div>
      
      {/* Chart Container */}
      <div className="p-4">
        <div className="h-40">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={chartData}
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
              margin={{ top: 10, right: 10, left: 10, bottom: 10 }}
              syncId="trainingCharts"
            >
              <CartesianGrid 
                strokeDasharray="3 3" 
                stroke="#f1f5f9" 
                strokeWidth={1}
                horizontal={true}
                vertical={false}
              />
              <XAxis 
                dataKey="time" 
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fill: '#64748b', fontWeight: 500 }}
                interval="preserveStartEnd"
                tickMargin={8}
              />
              <YAxis 
                domain={[yMin, yMax]}
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fill: '#64748b', fontWeight: 500 }}
                width={45}
                tickCount={getYTickCount()}
                tickFormatter={formatYTick}
                tickMargin={8}
              />
              <Tooltip 
                content={<CustomTooltip />}
                cursor={false}
                position={{ x: 0, y: 0 }}
                allowEscapeViewBox={{ x: true, y: true }}
              />
              <Line
                type="monotone"
                dataKey={metric}
                stroke={color}
                strokeWidth={2.5}
                dot={false}
                activeDot={{ 
                  r: 4, 
                  stroke: color, 
                  strokeWidth: 2, 
                  fill: 'white',
                  style: { filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))' }
                }}
                connectNulls={false}
              />
              {hoverTimeString && (
                <ReferenceLine 
                  x={hoverTimeString}
                  stroke="#475569" 
                  strokeDasharray="2 2"
                  strokeWidth={1.5}
                  style={{ pointerEvents: 'none' }}
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}