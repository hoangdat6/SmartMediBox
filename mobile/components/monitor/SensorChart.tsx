import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { format } from 'date-fns';
import {
  VictoryLine,
  VictoryChart,
  VictoryAxis,
  VictoryScatter,
  VictoryVoronoiContainer,
  VictoryTooltip,
} from 'victory-native';
import { DataPoint } from '@/hooks/useRealtimeData';

interface ChartLegendItem {
  name: string;
  color: string;
}

interface SensorChartProps {
  title: string;
  data: DataPoint[];
  dataKey: 'temperature' | 'humidity';
  viewingHistorical: boolean;
  theme: 'dark' | 'light';
  colors: {
    card: string;
    text: string;
    accent: string;
  };
  primaryColor: string;
  anomalyColor: string;
  unit: string;
}

const CustomLegend = ({ items, theme }: { items: ChartLegendItem[]; theme: 'dark' | 'light' }) => (
  <View style={styles.customLegend}>
    {items.map((item, index) => (
      <View key={index} style={styles.legendItem}>
        <View style={[styles.legendSymbol, { backgroundColor: item.color }]} />
        <Text style={[styles.legendText, { color: theme === 'dark' ? '#CCC' : '#333' }]}>
          {item.name}
        </Text>
      </View>
    ))}
  </View>
);

export const SensorChart = ({
  title,
  data,
  dataKey,
  viewingHistorical,
  theme,
  colors,
  primaryColor,
  anomalyColor,
  unit,
}: SensorChartProps) => {
  // Format data for Victory charts
  const formatChartData = () => {
    if (!data.length) return [];
    
    return data.map(point => ({
      x: new Date(point.timestamp),
      y: point[dataKey],
      anomaly: dataKey === 'temperature' ? point.isTemperatureAnomaly : point.isHumidityAnomaly
    }));
  };
  
  // Calculate domain range for chart
  const getDomainRange = () => {
    if (data.length === 0) {
      return dataKey === 'temperature' ? [20, 35] : [30, 80]; // Default ranges
    }
    
    const values = data.map(point => point[dataKey]);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const padding = dataKey === 'temperature' ? 2 : 5;
    
    return [Math.max(0, min - padding), max + padding];
  };
  
  // Format tick values for x-axis
  const formatXAxisTick = (tick: Date) => {
    return format(tick, 'HH:mm:ss');
  };

  const legendItems = [
    { 
      name: dataKey === 'temperature' ? `Nhiệt độ (${unit})` : `Độ ẩm (${unit})`, 
      color: primaryColor 
    },
    { name: "Bất thường", color: anomalyColor }
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.card }]}>
      <Text style={[styles.title, { color: colors.text }]}>
        {title}
        {viewingHistorical && (
          <Text style={[styles.historicalLabel, { color: colors.accent }]}> (Lịch sử)</Text>
        )}
      </Text>
      
      {data.length > 0 ? (
        <>
          <CustomLegend items={legendItems} theme={theme} />
          
          <VictoryChart
            width={Dimensions.get('window').width - 40}
            height={280}
            padding={{ top: 20, bottom: 60, left: 40, right: 20 }}
            domainPadding={{ y: 20 }}
            domain={{ y: getDomainRange() }}
            containerComponent={
              <VictoryVoronoiContainer
                voronoiDimension="x"
                labels={({ datum }) => 
                  `${format(datum.x, 'HH:mm:ss')}\n${datum.y.toFixed(1)}${unit}`
                }
                labelComponent={
                  <VictoryTooltip
                    cornerRadius={5}
                    flyoutStyle={{
                      fill: theme === 'dark' ? '#333' : 'white',
                      stroke: primaryColor,
                      strokeWidth: 1
                    }}
                    style={{ 
                      fill: theme === 'dark' ? 'white' : 'black',
                      fontSize: 12
                    }}
                  />
                }
              />
            }
          >
            <VictoryAxis
              tickFormat={formatXAxisTick}
              style={{
                axis: { stroke: theme === 'dark' ? '#666' : '#888' },
                tickLabels: { 
                  fill: theme === 'dark' ? '#CCC' : '#333', 
                  fontSize: 10,
                  angle: -45,
                  textAnchor: 'end',
                  padding: 5
                },
                grid: { stroke: theme === 'dark' ? '#333' : '#EEE', strokeDasharray: '4, 4' }
              }}
              tickCount={6}
            />
            
            <VictoryAxis
              dependentAxis
              style={{
                axis: { stroke: theme === 'dark' ? '#666' : '#888' },
                tickLabels: { fill: theme === 'dark' ? '#CCC' : '#333', fontSize: 10 },
                grid: { stroke: theme === 'dark' ? '#333' : '#EEE', strokeDasharray: '4, 4' }
              }}
            />
            
            <VictoryLine
              data={formatChartData()}
              style={{
                data: { stroke: primaryColor, strokeWidth: 2 }
              }}
              interpolation="natural"
            />
            
            <VictoryScatter
              data={formatChartData().filter(d => d.anomaly)}
              style={{
                data: { 
                  fill: anomalyColor,
                  stroke: primaryColor,
                  strokeWidth: 2
                }
              }}
              size={7}
            />
          </VictoryChart>
          
          <View style={styles.navigationHelperContainer}>
            <Text style={[styles.navigationHelperText, { color: theme === 'dark' ? '#AAA' : '#666' }]}>
              Sử dụng điều khiển thời gian để xem dữ liệu lịch sử
            </Text>
          </View>
        </>
      ) : (
        <Text style={[styles.noDataText, { color: theme === 'dark' ? '#AAA' : '#666' }]}>
          {viewingHistorical 
            ? "Không có dữ liệu cho giai đoạn này." 
            : "Không có dữ liệu sẵn có. Đang chờ các chỉ số từ cảm biến..."}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 10,
    borderRadius: 10,
    padding: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
  },
  historicalLabel: {
    fontSize: 14,
    fontStyle: 'italic',
  },
  customLegend: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 10,
    paddingHorizontal: 10,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 10,
  },
  legendSymbol: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 5,
  },
  legendText: {
    fontSize: 12,
  },
  navigationHelperContainer: {
    alignItems: 'center',
    marginTop: 5,
    marginBottom: 5,
  },
  navigationHelperText: {
    fontSize: 12,
    fontStyle: 'italic',
  },
  noDataText: {
    textAlign: 'center',
    fontSize: 16,
    fontStyle: 'italic',
    marginVertical: 20,
  },
});
