import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { TimeOfDay } from '@/types';
import { Header } from '@/components/Header';
import { useTheme } from '@/context/ThemeContext';
import { useHistoryData } from '@/hooks/useHistoryData';
import { SimpleChartView } from '@/components/SimpleChartView';

interface ChartData {
  x: string;
  y: number;
}

interface OpeningEvent {
  time: string;
  cabinet: TimeOfDay;
}

export default function HistoryScreen() {
  const { colors, theme } = useTheme();
  const { historyData, loading, error, fetchHistory } = useHistoryData();
  const [useSimpleChart, setUseSimpleChart] = useState(false);
  
  // Get a list of available dates from history data
  const availableDates = Object.keys(historyData || {}).sort((a, b) => 
    new Date(b).getTime() - new Date(a).getTime()
  );
  
  // Initialize with the first available date from the data or today's date as fallback
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    // Use the first date from the data if available, otherwise use today's date
    if (availableDates.length > 0) {
      return availableDates[0]; // Most recent date
    }
    return format(new Date(), 'yyyy-MM-dd');
  });
  
  // Update selectedDate when availableDates changes
  useEffect(() => {
    if (availableDates.length > 0 && !availableDates.includes(selectedDate)) {
      setSelectedDate(availableDates[0]);
    }
  }, [availableDates]);
  
  const [displayMode, setDisplayMode] = useState<'temperature' | 'humidity'>('temperature');

  // Function to format chart data from history
  const formatChartData = (): ChartData[] => {
    if (!historyData || !historyData[selectedDate]) return [];

    // Extract timepoints and values for selected date and mode
    const data = Object.entries(historyData[selectedDate]).map(([time, values]) => {
      const value = displayMode === 'temperature' ? values.temperature : values.humidity;
      return { x: time, y: value };
    });

    return data.sort((a, b) => {
      // Sort by time
      const [aHour, aMin] = a.x.split(':').map(Number);
      const [bHour, bMin] = b.x.split(':').map(Number);
      return (aHour * 60 + aMin) - (bHour * 60 + bMin);
    });
  };

  // Get opening events from history
  const getOpeningEvents = (): OpeningEvent[] => {
    if (!historyData || !historyData[selectedDate]) return [];
    
    return Object.entries(historyData[selectedDate])
      .filter(([_, values]) => values.cabinetOpened)
      .map(([time, values]) => ({
        time,
        cabinet: values.cabinetOpened as TimeOfDay
      }));
  };

  // Get previous date
  const getPreviousDate = () => {
    const currentIndex = availableDates.indexOf(selectedDate);
    if (currentIndex < availableDates.length - 1) {
      setSelectedDate(availableDates[currentIndex + 1]);
    }
  };

  // Get next date
  const getNextDate = () => {
    const currentIndex = availableDates.indexOf(selectedDate);
    if (currentIndex > 0) {
      setSelectedDate(availableDates[currentIndex - 1]);
    }
  };

  // Get cabinet name for display
  const getCabinetName = (cabinet: TimeOfDay): string => {
    switch (cabinet) {
      case 'sang': return 'Buổi sáng';
      case 'trua': return 'Buổi trưa';
      case 'toi': return 'Buổi tối';
      default: return cabinet;
    }
  };

  // Chart error handler
  const handleChartError = () => {
    console.log('Chart rendering error detected, switching to simple chart');
    setUseSimpleChart(true);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['bottom']}>
      <Header title="Lịch sử" />
      
      {loading ? (
        <Text style={[styles.loadingText, { color: colors.text }]}>Đang tải dữ liệu lịch sử...</Text>
      ) : error ? (
        <Text style={styles.errorText}>Lỗi: {error}</Text>
      ) : availableDates.length === 0 ? (
        <View style={styles.content}>
          <Text style={[styles.noDataText, { color: theme === 'dark' ? '#AAA' : '#666' }]}>
            Chưa có dữ liệu lịch sử
          </Text>
        </View>
      ) : (
        <ScrollView style={styles.scrollView}>
          <View style={[styles.dateNavigator, { backgroundColor: theme === 'dark' ? colors.card : '#f5f5f5' }]}>
            <TouchableOpacity 
              style={styles.navButton} 
              onPress={getPreviousDate}
              disabled={availableDates.indexOf(selectedDate) === availableDates.length - 1}
            >
              <MaterialCommunityIcons name="chevron-left" size={24} color={colors.text} />
            </TouchableOpacity>
            
            <Text style={[styles.dateText, { color: colors.text }]}>{selectedDate}</Text>
            
            <TouchableOpacity 
              style={styles.navButton} 
              onPress={getNextDate}
              disabled={availableDates.indexOf(selectedDate) === 0}
            >
              <MaterialCommunityIcons name="chevron-right" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          <View style={styles.chartModeSelector}>
            <TouchableOpacity
              style={[
                styles.modeButton,
                { backgroundColor: theme === 'dark' ? '#333' : '#f0f0f0' },
                displayMode === 'temperature' && {
                  backgroundColor: theme === 'dark' ? '#444' : '#e0e0e0'
                }
              ]}
              onPress={() => setDisplayMode('temperature')}
            >
              <Text 
                style={[
                  styles.modeText, 
                  { color: theme === 'dark' ? '#CCC' : '#666' },
                  displayMode === 'temperature' && {
                    color: theme === 'dark' ? '#FFF' : '#333',
                    fontWeight: 'bold'
                  }
                ]}
              >
                Nhiệt độ
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.modeButton,
                { backgroundColor: theme === 'dark' ? '#333' : '#f0f0f0' },
                displayMode === 'humidity' && {
                  backgroundColor: theme === 'dark' ? '#444' : '#e0e0e0'
                }
              ]}
              onPress={() => setDisplayMode('humidity')}
            >
              <Text 
                style={[
                  styles.modeText, 
                  { color: theme === 'dark' ? '#CCC' : '#666' },
                  displayMode === 'humidity' && {
                    color: theme === 'dark' ? '#FFF' : '#333',
                    fontWeight: 'bold'
                  }
                ]}
              >
                Độ ẩm
              </Text>
            </TouchableOpacity>
          </View>

          <View style={[styles.chartContainer, { backgroundColor: colors.card }]}>
            {formatChartData().length > 0 ? (
              <SimpleChartView 
                data={formatChartData()}
                title={displayMode === 'temperature' ? 'Nhiệt độ (°C)' : 'Độ ẩm (%)'}
                color={displayMode === 'temperature' ? '#FF5722' : '#03A9F4'}
                darkMode={theme === 'dark'}
              />
            ) : (
              <Text style={[styles.noDataText, { color: theme === 'dark' ? '#AAA' : '#666' }]}>
                Không có dữ liệu cho ngày này
              </Text>
            )}
          </View>

          <Text style={[styles.subheading, { color: colors.text }]}>Sự kiện mở ngăn thuốc</Text>

          {getOpeningEvents().length > 0 ? (
            <View style={[styles.eventsList, { backgroundColor: colors.card }]}>
              {getOpeningEvents().map((event, index) => (
                <View key={index} style={[styles.eventItem, { borderBottomColor: theme === 'dark' ? '#333' : '#f0f0f0' }]}>
                  <MaterialCommunityIcons 
                    name="pill" 
                    size={20} 
                    color={colors.primary} 
                    style={styles.eventIcon} 
                  />
                  <View style={styles.eventDetails}>
                    <Text style={[styles.eventTime, { color: colors.text }]}>{event.time}</Text>
                    <Text style={[styles.eventText, { color: theme === 'dark' ? '#AAA' : '#666' }]}>
                      Ngăn thuốc {getCabinetName(event.cabinet)} đã được mở
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <Text style={[styles.noDataText, { color: theme === 'dark' ? '#AAA' : '#666' }]}>
              Không có sự kiện mở ngăn nào được ghi lại cho ngày này
            </Text>
          )}
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
  heading: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  subheading: {
    fontSize: 18,
    fontWeight: 'bold',
    marginVertical: 15,
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
    color: '#666',
    marginVertical: 20,
  },
  dateNavigator: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    padding: 10,
  },
  navButton: {
    padding: 5,
  },
  dateText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  chartContainer: {
    marginVertical: 10,
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  chartModeSelector: {
    flexDirection: 'row',
    marginBottom: 15,
  },
  modeButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    borderRadius: 5,
    marginHorizontal: 5,
  },
  modeButtonActive: {
    backgroundColor: '#e0e0e0',
  },
  modeText: {
    fontSize: 14,
    color: '#666',
  },
  modeTextActive: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  eventsList: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  eventItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  eventIcon: {
    marginRight: 15,
  },
  eventDetails: {
    flex: 1,
  },
  eventTime: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  eventText: {
    fontSize: 14,
    color: '#666',
  },
  chartToggle: {
    alignSelf: 'flex-end',
    padding: 5,
    marginBottom: 5,
  },
});
