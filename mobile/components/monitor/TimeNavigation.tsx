import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { format } from 'date-fns';

interface TimeNavigationProps {
  timeOffset: number;
  timeWindow: number;
  viewingHistorical: boolean;
  onNavigate: (direction: 'forward' | 'backward') => void;
  onReset: () => void;
  colors: {
    card: string;
    text: string;
    primary: string;
  };
  theme: 'dark' | 'light';
}

export const TimeNavigation = ({
  timeOffset,
  timeWindow,
  viewingHistorical,
  onNavigate,
  onReset,
  colors,
  theme,
}: TimeNavigationProps) => {
  const formatTimeRange = () => {
    const now = new Date();
    
    if (timeOffset === 0) {
      return "Thời gian hiện tại";
    } else {
      const offsetDate = new Date(now.getTime() - timeOffset);
      return `${format(offsetDate, 'HH:mm')} - ${format(new Date(offsetDate.getTime() + timeWindow), 'HH:mm')}`;
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.card }]}>
      <TouchableOpacity 
        style={styles.navButton}
        onPress={() => onNavigate('backward')}
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
            onPress={onReset}
          >
            <Text style={styles.currentTimeText}>Quay lại hiện tại</Text>
          </TouchableOpacity>
        )}
      </View>
      
      <TouchableOpacity 
        style={[styles.navButton, { opacity: timeOffset === 0 ? 0.5 : 1 }]}
        onPress={() => onNavigate('forward')}
        disabled={timeOffset === 0}
      >
        <MaterialCommunityIcons 
          name="chevron-right" 
          size={24} 
          color={theme === 'dark' ? colors.text : colors.primary} 
        />
      </TouchableOpacity>
    </View>
  );
};

export const QuickTimeNavigation = ({
  onQuickNavigate,
  onReset,
  colors,
  theme,
}: {
  onQuickNavigate: (minutes: number) => void;
  onReset: () => void;
  colors: { text: string; primary: string };
  theme: 'dark' | 'light';
}) => {
  return (
    <View style={styles.quickNavContainer}>
      <Text style={[styles.quickNavLabel, { color: colors.text }]}>Chuyển nhanh:</Text>
      <View style={styles.quickNavButtons}>
        <TouchableOpacity 
          style={[styles.quickNavButton, { backgroundColor: theme === 'dark' ? '#333' : '#F5F5F5' }]} 
          onPress={() => onQuickNavigate(15)}
        >
          <Text style={[styles.quickNavButtonText, { color: colors.text }]}>15p trước</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.quickNavButton, { backgroundColor: theme === 'dark' ? '#333' : '#F5F5F5' }]} 
          onPress={() => onQuickNavigate(30)}
        >
          <Text style={[styles.quickNavButtonText, { color: colors.text }]}>30p trước</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.quickNavButton, { backgroundColor: theme === 'dark' ? '#333' : '#F5F5F5' }]} 
          onPress={() => onQuickNavigate(60)}
        >
          <Text style={[styles.quickNavButtonText, { color: colors.text }]}>1h trước</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.quickNavButton, { backgroundColor: theme === 'dark' ? '#333' : '#F5F5F5' }]} 
          onPress={onReset}
        >
          <Text style={[styles.quickNavButtonText, { color: colors.primary }]}>Hiện tại</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 10,
  },
  navButton: {
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
});
