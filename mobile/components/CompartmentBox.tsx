import React, { useEffect, useRef } from 'react';
import { StyleSheet, View, Text, Animated, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { TimeOfDay } from '@/types';
import { useTheme } from '@/context/ThemeContext';

interface CompartmentBoxProps {
  title: string;
  isOpen: boolean;
  timeOfDay: TimeOfDay;
  isCurrent: boolean;
  onPress?: (timeOfDay: TimeOfDay) => void;
}

export function CompartmentBox({ title, isOpen, timeOfDay, isCurrent, onPress }: CompartmentBoxProps) {
  const { colors, theme } = useTheme();
  
  // Animation value for compartment opening
  const animatedValue = useRef(new Animated.Value(isOpen ? 1 : 0)).current;

  // Update animation when isOpen changes
  useEffect(() => {
    Animated.timing(animatedValue, {
      toValue: isOpen ? 1 : 0,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [isOpen, animatedValue]);

  // Interpolate animation values
  const boxRotation = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '-45deg'],
  });

  // Define colors based on theme and state
  const getBoxColor = () => {
    if (theme === 'dark') {
      if (isOpen) return '#2E7D32'; // Dark green when open
      return isCurrent ? '#1A237E' : '#212121'; // Dark blue when current, dark gray otherwise
    } else {
      if (isOpen) return '#E8F5E9'; // Light green when open
      return isCurrent ? '#E3F2FD' : '#F5F5F5'; // Light blue when current, light gray otherwise
    }
  };

  const getLidColor = () => {
    if (theme === 'dark') {
      return isCurrent ? '#3949AB' : '#424242'; // Dark blue when current, gray otherwise
    } else {
      return isCurrent ? '#BBDEFB' : '#E0E0E0'; // Light blue when current, light gray otherwise
    }
  };

  const getPillColor = () => {
    if (theme === 'dark') {
      return isCurrent ? '#7986CB' : '#9E9E9E'; // Purple when current, gray otherwise
    } else {
      return isCurrent ? '#1976D2' : '#9E9E9E'; // Blue when current, gray otherwise
    }
  };

  const getBorderColor = () => {
    if (theme === 'dark') {
      return isCurrent ? '#3F51B5' : '#424242'; // Blue when current, gray otherwise
    } else {
      return isCurrent ? '#2196F3' : '#BDBDBD'; // Blue when current, gray otherwise
    }
  };

  const handlePress = () => {
    if (onPress) {
      onPress(timeOfDay);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={[
        styles.title, 
        { color: colors.text },
        isCurrent && { 
          color: theme === 'dark' ? '#7986CB' : '#1976D2',
          fontWeight: 'bold' 
        }
      ]}>
        {title}
      </Text>
      
      <TouchableOpacity activeOpacity={0.7} onPress={handlePress}>
        <Animated.View
          style={[
            styles.box,
            {
              backgroundColor: getBoxColor(),
              borderColor: getBorderColor(),
            },
          ]}
        >
          <View style={styles.boxContent}>
            <Animated.View
              style={[
                styles.lid,
                {
                  transform: [{ rotateX: boxRotation }],
                  backgroundColor: getLidColor(),
                },
              ]}
            />
            
            <View style={styles.pillsContainer}>
              <MaterialCommunityIcons
                name="pill"
                size={24}
                color={getPillColor()}
              />
            </View>
          </View>
        </Animated.View>
      </TouchableOpacity>
      
      <Text style={[
        styles.status, 
        { color: theme === 'dark' ? colors.text : undefined },
        isOpen ? styles.openStatus : styles.closedStatus
      ]}>
        {isOpen ? 'Đã mở' : 'Đóng'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    width: '30%',
  },
  title: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 5,
  },
  box: {
    width: 80,
    height: 80,
    borderRadius: 10,
    borderWidth: 2,
    overflow: 'hidden',
    marginBottom: 5,
  },
  boxContent: {
    position: 'relative',
    width: '100%',
    height: '100%',
  },
  lid: {
    position: 'absolute',
    width: '100%',
    height: '30%',
    top: 0,
    zIndex: 2,
    borderBottomWidth: 1,
    borderBottomColor: '#DDD',
    transformOrigin: 'top',
  },
  pillsContainer: {
    position: 'absolute',
    bottom: 15,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  status: {
    fontSize: 12,
    fontWeight: '500',
  },
  openStatus: {
    color: '#4CAF50',
  },
  closedStatus: {
    color: '#9E9E9E',
  },
});
