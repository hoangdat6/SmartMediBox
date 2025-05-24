import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';

interface DataPoint {
  x: string;
  y: number;
}

interface SimpleChartViewProps {
  data: DataPoint[];
  title: string;
  color: string;
  darkMode: boolean;
}

export function SimpleChartView({ data, title, color, darkMode }: SimpleChartViewProps) {
  if (data.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={[styles.noDataText, { color: darkMode ? '#AAA' : '#666' }]}>
          No data available
        </Text>
      </View>
    );
  }
  
  // Find min and max values for scaling
  const maxValue = Math.max(...data.map(d => d.y));
  const minValue = Math.min(...data.map(d => d.y));
  const range = maxValue - minValue || 1; // Avoid division by zero
  
  // Chart dimensions
  const chartWidth = Dimensions.get('window').width - 80;
  const chartHeight = 180;
  const barWidth = chartWidth / data.length - 10;
  
  return (
    <View style={styles.container}>
      <Text style={[styles.title, { color: darkMode ? '#CCC' : '#333' }]}>{title}</Text>
      
      <View style={styles.chartArea}>
        {/* Y-axis labels */}
        <View style={styles.yAxis}>
          <Text style={[styles.yLabel, { color: darkMode ? '#AAA' : '#666' }]}>
            {Math.round(maxValue)}
          </Text>
          <Text style={[styles.yLabel, { color: darkMode ? '#AAA' : '#666' }]}>
            {Math.round(minValue + range/2)}
          </Text>
          <Text style={[styles.yLabel, { color: darkMode ? '#AAA' : '#666' }]}>
            {Math.round(minValue)}
          </Text>
        </View>
        
        {/* Bars for data points */}
        <View style={styles.barsContainer}>
          {data.map((point, index) => {
            const normalizedHeight = ((point.y - minValue) / range) * chartHeight;
            return (
              <View key={index} style={styles.barGroup}>
                <View 
                  style={[
                    styles.bar, 
                    { 
                      height: normalizedHeight, 
                      width: barWidth,
                      backgroundColor: color
                    }
                  ]} 
                />
                <Text style={[styles.xLabel, { color: darkMode ? '#AAA' : '#666' }]}>
                  {point.x}
                </Text>
              </View>
            );
          })}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 10,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 15,
  },
  noDataText: {
    textAlign: 'center',
    fontSize: 16,
    fontStyle: 'italic',
    marginVertical: 20,
  },
  chartArea: {
    flexDirection: 'row',
    height: 200,
    alignItems: 'flex-end',
  },
  yAxis: {
    width: 30,
    height: 180,
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginRight: 10,
  },
  yLabel: {
    fontSize: 10,
  },
  barsContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 180,
    justifyContent: 'space-around',
  },
  barGroup: {
    alignItems: 'center',
  },
  bar: {
    borderTopLeftRadius: 3,
    borderTopRightRadius: 3,
  },
  xLabel: {
    fontSize: 10,
    marginTop: 5,
  },
});
