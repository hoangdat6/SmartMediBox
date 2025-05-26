import React, { useState, useRef, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView, Dimensions, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { format, parseISO } from 'date-fns';
import { 
  VictoryLine, 
  VictoryChart, 
  VictoryAxis, 
  VictoryScatter,
  VictoryVoronoiContainer,
  VictoryTooltip
} from 'victory-native';
import { Header } from '@/components/Header';
import { useTheme } from '@/context/ThemeContext';
import { useRealtimeData } from '@/hooks/useRealtimeData';

// Function to format date from ISO string for display
const formatDateTime = (isoString: string): string => {
  try {
    return format(parseISO(isoString), 'HH:mm:ss');
  } catch (e) {
    console.error("Error formatting date:", e);
    return isoString;
  }
};

export default function MonitorScreen() {
  const { colors, theme } = useTheme();
  const [timeWindow, setTimeWindow] = useState<number>(3600000); // 1 hour in milliseconds
  const [viewingHistorical, setViewingHistorical] = useState<boolean>(false);
  const [timeOffset, setTimeOffset] = useState<number>(0); // 0 means current time
  
  const scrollRef = useRef<ScrollView>(null);
  
  const { 
    realtimeData, 
    currentTemperature, 
    currentHumidity,
    temperatureAnomaly,
    humidityAnomaly,
    loading, 
    error 
  } = useRealtimeData(timeWindow);

  // Time window options
  const timeWindows = [
    { label: '15 Phút', value: 15 * 60 * 1000 },
    { label: '1 Giờ', value: 60 * 60 * 1000 },
    { label: '3 Giờ', value: 3 * 60 * 60 * 1000 },
    { label: '6 Giờ', value: 6 * 60 * 60 * 1000 },
  ];

  // Function to navigate time periods
  const navigateTime = (direction: 'forward' | 'backward') => {
    // Calculate new offset based on 30 minute increments
    const increment = 30 * 60 * 1000; // 30 minutes in milliseconds
    const newOffset = direction === 'forward' 
      ? Math.max(0, timeOffset - increment) 
      : timeOffset + increment;
    
    setTimeOffset(newOffset);
    setViewingHistorical(newOffset > 0);
  };
  
  // Enhanced navigation with more time ranges
  const quickNavigateTo = (minutesAgo: number) => {
    const newOffset = minutesAgo * 60 * 1000;
    setTimeOffset(newOffset);
    setViewingHistorical(newOffset > 0);
  };
  
  // Function to reset to current time view
  const resetToCurrentTime = () => {
    setTimeOffset(0);
    setViewingHistorical(false);
  };
  
  // Filter data based on time offset
  const getFilteredData = () => {
    if (timeOffset === 0) {
      return realtimeData; // Current data
    } else {
      // Apply time offset to filter historical data
      const now = Date.now();
      const offsetTime = now - timeOffset;
      const endTime = offsetTime;
      const startTime = endTime - timeWindow;
      
      return realtimeData.filter(point => {
        return point.timestamp >= startTime && point.timestamp <= endTime;
      });
    }
  };
  
  const filteredData = getFilteredData();

  // Make sure we always have appropriate domain ranges for the charts
  const getDomainRange = (dataKey: 'temperature' | 'humidity') => {
    if (filteredData.length === 0) {
      return dataKey === 'temperature' ? [20, 35] : [30, 80]; // Default ranges if no data
    }
    
    // Calculate actual min and max values with padding
    const values = filteredData.map(point => point[dataKey]);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const padding = dataKey === 'temperature' ? 2 : 5;
    
    return [Math.max(0, min - padding), max + padding];
  };
  
  // Format data for Victory charts with better handling for ISO timestamps
  const formatChartData = (dataKey: 'temperature' | 'humidity') => {
    if (!filteredData.length) return [];
    
    return filteredData.map(point => ({
      x: new Date(point.timestamp),
      y: point[dataKey],
      anomaly: dataKey === 'temperature' ? point.isTemperatureAnomaly : point.isHumidityAnomaly
    }));
  };
  
  // Format tick values for x-axis
  const formatXAxisTick = (tick: Date) => {
    return format(tick, 'HH:mm:ss');
  };

  // Victory theme based on current app theme
  const chartTheme = {
    axis: {
      style: {
        axis: { 
          stroke: theme === 'dark' ? '#666' : '#888'
        },
        tickLabels: {
          fill: theme === 'dark' ? '#CCC' : '#333',
          fontSize: 10
        },
        grid: {
          stroke: theme === 'dark' ? '#333' : '#EEE',
          strokeDasharray: '4, 4'
        }
      }
    },
    line: {
      style: {
        data: { stroke: "#c43a31" }
      }
    }
  };

  // Create a manual legend component instead of using VictoryLegend
  const CustomLegend = ({ items }: { items: Array<{ name: string; color: string }> }) => (
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

  // Format time range for display
  const formatTimeRange = () => {
    const now = new Date();
    
    if (timeOffset === 0) {
      return "Thời gian hiện tại";
    } else {
      const offsetDate = new Date(now.getTime() - timeOffset);
      return `${format(offsetDate, 'HH:mm')} - ${format(new Date(offsetDate.getTime() + timeWindow), 'HH:mm')}`;
    }
  };

  // Debug: Log data when it changes
  useEffect(() => {
    console.log(`Filtered data count: ${filteredData.length}`);
  }, [filteredData]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['bottom']}>
      <Header title="Theo dõi thời gian thực" />
      
      {loading && realtimeData.length === 0 ? (
        <Text style={[styles.loadingText, { color: colors.text }]}>Đang tải dữ liệu cảm biến...</Text>
      ) : error ? (
        <Text style={styles.errorText}>Lỗi: {error}</Text>
      ) : (
        <ScrollView style={styles.scrollView}>
          <View style={styles.statusCards}>
            <View style={[
              styles.statusCard, 
              { 
                backgroundColor: colors.card,
                borderColor: temperatureAnomaly ? '#FF5722' : colors.border,
                borderWidth: temperatureAnomaly ? 2 : 1
              }
            ]}>
              <MaterialCommunityIcons 
                name="thermometer" 
                size={28} 
                color={temperatureAnomaly ? '#FF5722' : colors.primary} 
              />
              <Text style={[styles.statusValue, { color: temperatureAnomaly ? '#FF5722' : colors.text }]}>
                {currentTemperature ? `${currentTemperature.toFixed(1)}°C` : '--°C'}
              </Text>
              <Text style={[styles.statusLabel, { color: colors.text }]}>Nhiệt độ</Text>
              {temperatureAnomaly && (
                <View style={styles.anomalyBadge}>
                  <MaterialCommunityIcons name="alert" size={16} color="#FFF" />
                  <Text style={styles.anomalyText}>Bất thường</Text>
                </View>
              )}
            </View>

            <View style={[
              styles.statusCard, 
              { 
                backgroundColor: colors.card,
                borderColor: humidityAnomaly ? '#03A9F4' : colors.border,
                borderWidth: humidityAnomaly ? 2 : 1
              }
            ]}>
              <MaterialCommunityIcons 
                name="water-percent" 
                size={28} 
                color={humidityAnomaly ? '#03A9F4' : colors.secondary} 
              />
              <Text style={[styles.statusValue, { color: humidityAnomaly ? '#03A9F4' : colors.text }]}>
                {currentHumidity ? `${currentHumidity.toFixed(1)}%` : '--%'}
              </Text>
              <Text style={[styles.statusLabel, { color: colors.text }]}>Độ ẩm</Text>
              {humidityAnomaly && (
                <View style={[styles.anomalyBadge, { backgroundColor: '#03A9F4' }]}>
                  <MaterialCommunityIcons name="alert" size={16} color="#FFF" />
                  <Text style={styles.anomalyText}>Bất thường</Text>
                </View>
              )}
            </View>
          </View>

          <View style={styles.timeWindowSelector}>
            <Text style={[styles.selectorLabel, { color: colors.text }]}>Khung thời gian:</Text>
            <View style={styles.timeButtons}>
              {timeWindows.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.timeButton,
                    { 
                      backgroundColor: timeWindow === option.value 
                        ? theme === 'dark' ? colors.primary : '#E0F2F1'
                        : theme === 'dark' ? '#333' : '#F5F5F5'
                    }
                  ]}
                  onPress={() => setTimeWindow(option.value)}
                >
                  <Text style={[
                    styles.timeButtonText,
                    { 
                      color: timeWindow === option.value 
                        ? theme === 'dark' ? '#FFF' : colors.primary
                        : colors.text 
                    }
                  ]}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Improved time navigation controls */}
          <View style={[styles.timeNavContainer, { backgroundColor: colors.card }]}>
            <TouchableOpacity 
              style={styles.timeNavButton}
              onPress={() => navigateTime('backward')}
            >
              <MaterialCommunityIcons 
                name="chevron-left" 
                size={24} 
                color={theme === 'dark' ? colors.text : colors.primary} 
              />
            </TouchableOpacity>
            
            <View style={styles.timeRangeContainer}>
              <Text style={[styles.timeRangeText, { color: colors.text }]}>
                {formatTimeRange()}
              </Text>
              {viewingHistorical && (
                <TouchableOpacity 
                  style={[styles.currentTimeButton, { backgroundColor: colors.primary }]}
                  onPress={resetToCurrentTime}
                >
                  <Text style={styles.currentTimeText}>Quay lại hiện tại</Text>
                </TouchableOpacity>
              )}
            </View>
            
            <TouchableOpacity 
              style={[styles.timeNavButton, { opacity: timeOffset === 0 ? 0.5 : 1 }]}
              onPress={() => navigateTime('forward')}
              disabled={timeOffset === 0}
            >
              <MaterialCommunityIcons 
                name="chevron-right" 
                size={24} 
                color={theme === 'dark' ? colors.text : colors.primary} 
              />
            </TouchableOpacity>
          </View>

          {/* Quick time navigation shortcuts */}
          <View style={styles.quickNavContainer}>
            <Text style={[styles.quickNavLabel, { color: colors.text }]}>Chuyển nhanh:</Text>
            <View style={styles.quickNavButtons}>
              <TouchableOpacity 
                style={[styles.quickNavButton, { backgroundColor: theme === 'dark' ? '#333' : '#F5F5F5' }]} 
                onPress={() => quickNavigateTo(15)}
              >
                <Text style={[styles.quickNavButtonText, { color: colors.text }]}>15p trước</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.quickNavButton, { backgroundColor: theme === 'dark' ? '#333' : '#F5F5F5' }]} 
                onPress={() => quickNavigateTo(30)}
              >
                <Text style={[styles.quickNavButtonText, { color: colors.text }]}>30p trước</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.quickNavButton, { backgroundColor: theme === 'dark' ? '#333' : '#F5F5F5' }]} 
                onPress={() => quickNavigateTo(60)}
              >
                <Text style={[styles.quickNavButtonText, { color: colors.text }]}>1h trước</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.quickNavButton, { backgroundColor: theme === 'dark' ? '#333' : '#F5F5F5' }]} 
                onPress={resetToCurrentTime}
              >
                <Text style={[styles.quickNavButtonText, { color: colors.primary }]}>Hiện tại</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Temperature chart */}
          <View style={[styles.chartContainer, { backgroundColor: colors.card }]}>
            <Text style={[styles.chartTitle, { color: colors.text }]}>
              Nhiệt độ
              {viewingHistorical && (
                <Text style={[styles.historicalLabel, { color: colors.accent }]}> (Lịch sử)</Text>
              )}
            </Text>
            
            {filteredData.length > 0 ? (
              <>
                <CustomLegend 
                  items={[
                    { name: "Nhiệt độ (°C)", color: "#FF5722" },
                    { name: "Bất thường", color: "#FF9800" }
                  ]} 
                />
                
                <VictoryChart
                  key="temperature-chart"
                  width={Dimensions.get('window').width - 40}
                  height={280}
                  padding={{ top: 20, bottom: 60, left: 60, right: 20 }}
                  domainPadding={{ y: 20 }}
                  domain={{ y: getDomainRange('temperature') }}
                  containerComponent={
                    <VictoryVoronoiContainer
                      key="temperature-container"
                      voronoiDimension="x"
                      labels={({ datum }) => 
                        `${format(datum.x, 'HH:mm:ss')}\n${datum.y.toFixed(1)}°C`
                      }
                      labelComponent={
                        <VictoryTooltip
                          key="temperature-tooltip"
                          cornerRadius={5}
                          flyoutStyle={{
                            fill: theme === 'dark' ? '#333' : 'white',
                            stroke: '#FF5722',
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
                    key="temperature-x-axis"
                    tickFormat={formatXAxisTick}
                    style={{
                      axis: { stroke: theme === 'dark' ? '#666' : '#888' },
                      tickLabels: { 
                        fill: theme === 'dark' ? '#CCC' : '#333', 
                        fontSize: 10,
                        angle: -45,        // Add rotation angle
                        textAnchor: 'end', // Align the rotated text
                        padding: 5         // Add some padding
                      },
                      grid: { stroke: theme === 'dark' ? '#333' : '#EEE', strokeDasharray: '4, 4' }
                    }}
                    tickCount={6}
                  />
                  
                  <VictoryAxis
                    key="temperature-y-axis"
                    dependentAxis
                    style={{
                      axis: { stroke: theme === 'dark' ? '#666' : '#888' },
                      tickLabels: { fill: theme === 'dark' ? '#CCC' : '#333', fontSize: 10 },
                      grid: { stroke: theme === 'dark' ? '#333' : '#EEE', strokeDasharray: '4, 4' }
                    }}
                  />
                  
                  <VictoryLine
                    key="temperature-line"
                    data={formatChartData('temperature')}
                    style={{
                      data: { stroke: "#FF5722", strokeWidth: 2 }
                    }}
                    interpolation="natural"
                  />
                  
                  <VictoryScatter
                    key="temperature-anomalies"
                    data={formatChartData('temperature').filter(d => d.anomaly)}
                    style={{
                      data: { 
                        fill: "#FF9800",
                        stroke: "#FF5722",
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

          {/* Humidity chart */}
          <View style={[styles.chartContainer, { backgroundColor: colors.card }]}>
            <Text style={[styles.chartTitle, { color: colors.text }]}>
              Độ ẩm
              {viewingHistorical && (
                <Text style={[styles.historicalLabel, { color: colors.accent }]}> (Lịch sử)</Text>
              )}
            </Text>
            
            {filteredData.length > 0 ? (
              <>
                <CustomLegend 
                  items={[
                    { name: "Độ ẩm (%)", color: "#03A9F4" },
                    { name: "Bất thường", color: "#4FC3F7" }
                  ]} 
                />
                
                <VictoryChart
                  key="humidity-chart"
                  width={Dimensions.get('window').width - 40}
                  height={280}
                  padding={{ top: 20, bottom: 60, left: 60, right: 20 }}
                  domainPadding={{ y: 20 }}
                  domain={{ y: getDomainRange('humidity') }}
                  containerComponent={
                    <VictoryVoronoiContainer
                      key="humidity-container"
                      voronoiDimension="x"
                      labels={({ datum }) => 
                        `${format(datum.x, 'HH:mm:ss')}\n${datum.y.toFixed(1)}%`
                      }
                      labelComponent={
                        <VictoryTooltip
                          key="humidity-tooltip"
                          cornerRadius={5}
                          flyoutStyle={{
                            fill: theme === 'dark' ? '#333' : 'white',
                            stroke: '#03A9F4',
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
                    key="humidity-x-axis"
                    tickFormat={formatXAxisTick}
                    style={{
                      axis: { stroke: theme === 'dark' ? '#666' : '#888' },
                      tickLabels: { 
                        fill: theme === 'dark' ? '#CCC' : '#333', 
                        fontSize: 10,
                        angle: -45,        // Add rotation angle
                        textAnchor: 'end', // Align the rotated text
                        padding: 5         // Add some padding
                      },
                      grid: { stroke: theme === 'dark' ? '#333' : '#EEE', strokeDasharray: '4, 4' }
                    }}
                    tickCount={6}
                  />
                  
                  <VictoryAxis
                    key="humidity-y-axis"
                    dependentAxis
                    style={{
                      axis: { stroke: theme === 'dark' ? '#666' : '#888' },
                      tickLabels: { fill: theme === 'dark' ? '#CCC' : '#333', fontSize: 10 },
                      grid: { stroke: theme === 'dark' ? '#333' : '#EEE', strokeDasharray: '4, 4' }
                    }}
                  />
                  
                  <VictoryLine
                    key="humidity-line"
                    data={formatChartData('humidity')}
                    style={{
                      data: { stroke: "#03A9F4", strokeWidth: 2 }
                    }}
                    interpolation="natural"
                  />
                  
                  <VictoryScatter
                    key="humidity-anomalies"
                    data={formatChartData('humidity').filter(d => d.anomaly)}
                    style={{
                      data: { 
                        fill: "#4FC3F7",
                        stroke: "#03A9F4",
                        strokeWidth: 2,
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

          <View style={styles.infoSection}>
            <Text style={[styles.infoTitle, { color: colors.text }]}>
              Về phát hiện bất thường
            </Text>
            <Text style={[styles.infoText, { color: theme === 'dark' ? '#AAA' : '#666' }]}>
              Hệ thống tự động phát hiện các đột biến hoặc giảm bất thường trong các chỉ số cảm biến
              bằng cách phân tích thống kê. Các chỉ số khác biệt đáng kể so với
              mẫu gần đây được đánh dấu là bất thường.
            </Text>
            <Text style={[styles.infoNote, { color: theme === 'dark' ? '#AAA' : '#666' }]}>
              Dữ liệu cảm biến được thu thập mỗi 5 giây và phân tích theo thời gian thực.
            </Text>
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
    padding: 20,
  },
  loadingText: {
    fontSize: 18,
    textAlign: 'center',
    marginTop: 50,
  },
  errorText: {
    fontSize: 18,
    color: 'red',
    textAlign: 'center',
    marginTop: 50,
  },
  noDataText: {
    textAlign: 'center',
    fontSize: 16,
    fontStyle: 'italic',
    marginVertical: 20,
  },
  statusCards: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  statusCard: {
    width: '48%',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    position: 'relative',
  },
  statusValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 5,
  },
  statusLabel: {
    fontSize: 14,
    marginTop: 5,
  },
  anomalyBadge: {
    position: 'absolute',
    top: -10,
    right: -10,
    backgroundColor: '#FF5722',
    borderRadius: 15,
    paddingHorizontal: 8,
    paddingVertical: 3,
    flexDirection: 'row',
    alignItems: 'center',
  },
  anomalyText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 3,
  },
  timeWindowSelector: {
    marginBottom: 20,
  },
  selectorLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  timeButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  timeButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    alignItems: 'center',
  },
  timeButtonText: {
    fontSize: 12,
    fontWeight: '500',
  },
  chartContainer: {
    marginVertical: 10,
    borderRadius: 10,
    padding: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
  },
  infoSection: {
    marginTop: 20,
    marginBottom: 40,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  infoText: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 10,
  },
  infoNote: {
    fontSize: 12,
    fontStyle: 'italic',
  },
  // Add these new styles
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
  timeNavContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 10,
  },
  timeNavButton: {
    padding: 8,
  },
  timeRangeContainer: {
    alignItems: 'center',
  },
  timeRangeText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  currentTimeButton: {
    marginTop: 5,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
  },
  currentTimeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  quickNavContainer: {
    marginBottom: 15,
  },
  quickNavLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  quickNavButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  quickNavButton: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 15,
    alignItems: 'center',
  },
  quickNavButtonText: {
    fontSize: 12,
    fontWeight: '500',
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
  historicalLabel: {
    fontSize: 14,
    fontStyle: 'italic',
  },
});
