import React from 'react';
import { StyleSheet, View, ActivityIndicator } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { HelloWave } from '@/components/HelloWave';
import { useThemeColor } from '@/hooks/useThemeColor';

interface LoadingProps {
  message?: string;
  fullscreen?: boolean;
  showWave?: boolean;
}

export function Loading({ 
  message = 'Loading...', 
  fullscreen = false,
  showWave = true
}: LoadingProps) {
  const primaryColor = useThemeColor({}, 'primary');
  
  return (
    <ThemedView style={[
      styles.container, 
      fullscreen && styles.fullscreen
    ]}>
      <View style={styles.content}>
        {showWave && (
          <View style={styles.waveContainer}>
            <HelloWave />
          </View>
        )}
        
        <View style={styles.indicatorContainer}>
          <ActivityIndicator size="large" color={primaryColor} />
        </View>
        
        <ThemedText style={styles.message}>{message}</ThemedText>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 150,
  },
  fullscreen: {
    flex: 1,
    borderRadius: 0,
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  waveContainer: {
    marginBottom: 15,
  },
  indicatorContainer: {
    marginBottom: 15,
  },
  message: {
    fontSize: 16,
    textAlign: 'center',
  }
});
