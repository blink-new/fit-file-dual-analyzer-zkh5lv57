import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, ReferenceLine, Tooltip } from 'recharts';
import { ChartDataPoint } from '../types/fit';

interface MetricChartProps {
  data: ChartDataPoint[];
  metric: string;
  color: string;
  unit: string;
  timeDomain: [number, number];
  hoverTime?: number | null;
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

export function MetricChart({ data, metric, color, timeDomain, hoverTime, onHover }: MetricChartProps) {
  // Filter data to only include points where this metric has valid values
  const validData = data.filter(point => {
    const value = point[metric as keyof ChartDataPoint] as number;
    return value !== undefined && value !== null && !isNaN(value);
  });
  
  if (validData.length === 0) {
    return null;
  }

  // Use ALL data points to ensure perfect alignment, but only calculate Y domain from valid data
  const chartData = data.map(point => ({
    ...point,
    [metric]: point[metric as keyof ChartDataPoint] || null
  }));

  const values = validData.map(point => point[metric as keyof ChartDataPoint] as number);
  const minValue = Math.min(...values);
  const maxValue = Math.max(...values);
  
  const range = maxValue - minValue;
  let padding = range * 0.1;
  if (range === 0) padding = Math.max(maxValue * 0.1, 1);

  const yMin = Math.max(0, minValue - padding);
  const yMax = maxValue + padding;

  const formatYTick = (value: number) => {
    return metric === 'speed' ? value.toFixed(1) : Math.round(value).toString();
  };

  const formatXAxis = (tickItem: number) => {
    return new Date(tickItem).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const handleMouseMove = (e: any) => {
    if (e && e.activePayload && e.activePayload.length > 0) {
      const timestamp = e.activePayload[0].payload.timestamp;
      if (onHover) {
        onHover(timestamp);
      }
    }
  };

  const handleMouseLeave = () => {
    if (onHover) {
      onHover(null);
    }
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length > 0) {
      const value = payload[0].value;
      if (value !== null && value !== undefined && !isNaN(value)) {
        return (
          <div className="bg-gray-900 text-white px-3 py-2 rounded-lg shadow-lg text-sm font-medium border border-gray-700">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
              <span>{metricLabels[metric]}: {formatYTick(value)} {metricUnits[metric]}</span>
            </div>
            <div className="text-gray-300 text-xs mt-1">
              Time: {new Date(label).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </div>
          </div>
        );
      }
    }
    return null;
  };

  return (
    <div className="bg-white rounded-lg border shadow-sm">
      <div className="flex items-center justify-between px-4 py-3 border-b bg-gray-50/50">
        <h3 className="text-sm font-semibold text-gray-900">{metricLabels[metric] || metric}</h3>
        <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded">{metricUnits[metric] || ''}</span>
      </div>
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
                dataKey="timestamp" 
                type="number"
                domain={timeDomain}
                scale="time"
                axisLine={false}
                tickLine={false}
                tickFormatter={formatXAxis}
                tick={{ fontSize: 11, fill: '#64748b', fontWeight: 500 }}
                interval="preserveStartEnd"
                tickMargin={8}
                allowDataOverflow={false}
              />
              <YAxis 
                domain={[yMin, yMax]}
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fill: '#64748b', fontWeight: 500 }}
                width={45}
                tickFormatter={formatYTick}
                tickMargin={8}
              />
              <Tooltip 
                content={<CustomTooltip />}
                cursor={false}
                position={{ y: -100 }}
                allowEscapeViewBox={{ x: true, y: true }}
              />
              <Line
                type="monotone"
                dataKey={metric}
                stroke={color}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, stroke: color, strokeWidth: 2, fill: 'white' }}
                connectNulls={false}
                strokeDasharray={undefined}
              />
              {hoverTime && (
                <ReferenceLine 
                  x={hoverTime} 
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