import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, StatusBar } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '@/context/ThemeContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface HeaderProps {
  title?: string;
}

export function Header({ title = 'SmartMediBox' }: HeaderProps) {
  const { theme, toggleTheme, colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [isConnected, setIsConnected] = useState(true);
  
  // Simulate checking WiFi connection status
  useEffect(() => {
    const interval = setInterval(() => {
      // In a real app, you would implement actual WiFi checking logic here
      // For this demo, we'll just randomly toggle between connected and disconnected
      setIsConnected(Math.random() > 0.2); // 80% chance of being connected
    }, 5000);
    
    return () => clearInterval(interval);
  }, []);

  return (
    <>
      <StatusBar
        barStyle={theme === 'dark' ? 'light-content' : 'dark-content'}
        backgroundColor={colors.background}
      />
      <View style={[
        styles.container,
        { 
          backgroundColor: colors.background,
          borderBottomColor: colors.border,
          paddingTop: insets.top,
        }
      ]}>
        <View style={styles.titleContainer}>
          <MaterialCommunityIcons 
            name="pill" 
            size={24} 
            color={colors.primary}
            style={styles.logo} 
          />
          <Text style={[styles.title, { color: colors.text }]}>
            {title}
          </Text>
        </View>
        
        <View style={styles.rightSection}>
          <View style={styles.wifiContainer}>
            <MaterialCommunityIcons
              name={isConnected ? "wifi" : "wifi-off"}
              size={20}
              color={isConnected ? colors.primary : '#FF5252'}
            />
            <Text style={[
              styles.connectionText,
              { color: isConnected ? colors.primary : '#FF5252' }
            ]}>
              {isConnected ? 'Online' : 'Offline'}
            </Text>
          </View>
          
          <TouchableOpacity onPress={toggleTheme} style={styles.themeToggle}>
            <MaterialCommunityIcons
              name={theme === 'dark' ? 'weather-night' : 'white-balance-sunny'}
              size={24}
              color={theme === 'dark' ? '#FFC107' : '#FF9800'}
            />
          </TouchableOpacity>
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logo: {
    marginRight: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  wifiContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  connectionText: {
    fontSize: 12,
    marginLeft: 4,
  },
  themeToggle: {
    padding: 5,
  }
});
