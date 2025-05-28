import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

interface TimeOption {
  label: string;
  value: number;
}

interface TimeWindowSelectorProps {
  options: TimeOption[];
  selectedValue: number;
  onSelect: (value: number) => void;
  colors: {
    text: string;
    primary: string;
  };
  theme: 'dark' | 'light';
}

export const TimeWindowSelector = ({
  options,
  selectedValue,
  onSelect,
  colors,
  theme,
}: TimeWindowSelectorProps) => {
  return (
    <View style={styles.container}>
      <Text style={[styles.label, { color: colors.text }]}>Khung thời gian:</Text>
      <View style={styles.timeButtons}>
        {options.map((option) => (
          <TouchableOpacity
            key={option.value}
            style={[
              styles.timeButton,
              {
                backgroundColor:
                  selectedValue === option.value
                    ? theme === 'dark'
                      ? colors.primary
                      : '#E0F2F1'
                    : theme === 'dark'
                      ? '#333'
                      : '#F5F5F5',
              },
            ]}
            onPress={() => onSelect(option.value)}
          >
            <Text
              style={[
                styles.timeButtonText,
                {
                  color:
                    selectedValue === option.value
                      ? theme === 'dark'
                        ? '#FFF'
                        : colors.primary
                      : colors.text,
                },
              ]}
            >
              {option.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  label: {
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
});
