import { useState, useEffect } from 'react';
import { format } from 'date-fns';

export interface DataPoint {
  timestamp: number;  // Use numeric timestamp for realtime data
  temperature: number;
  humidity: number;
  isTemperatureAnomaly?: boolean;
  isHumidityAnomaly?: boolean;
}

interface UseRealtimeDataResult {
  realtimeData: DataPoint[];
  currentTemperature: number | null;
  currentHumidity: number | null;
  temperatureAnomaly: boolean;
  humidityAnomaly: boolean;
  loading: boolean;
  error: string | null;
}

// Helper function to calculate mean
const calculateMean = (values: number[]): number => {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
};

// Helper function to calculate standard deviation
const calculateStdDev = (values: number[], mean: number): number => {
  if (values.length <= 1) return 0;
  const squaredDifferences = values.map(value => Math.pow(value - mean, 2));
  const variance = calculateMean(squaredDifferences);
  return Math.sqrt(variance);
};

// Detect anomalies using z-score
const isAnomaly = (value: number, mean: number, stdDev: number): boolean => {
  if (stdDev === 0) return false;
  const zScore = Math.abs((value - mean) / stdDev);
  return zScore > 2.5; // Threshold for anomaly detection
};

export const useRealtimeData = (timeWindow: number = 3600000): UseRealtimeDataResult => {
  const [realtimeData, setRealtimeData] = useState<DataPoint[]>([]);
  const [currentTemperature, setCurrentTemperature] = useState<number | null>(null);
  const [currentHumidity, setCurrentHumidity] = useState<number | null>(null);
  const [temperatureAnomaly, setTemperatureAnomaly] = useState<boolean>(false);
  const [humidityAnomaly, setHumidityAnomaly] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Generate initial mock data
    const generateInitialData = () => {
      try {
        const now = Date.now();
        const data: DataPoint[] = [];
        let baseTemp = 28;
        let baseHumidity = 60;
        
        // Generate data points for the past timeWindow
        for (let i = 0; i < 30; i++) {
          const timestamp = now - (30 - i) * 5000; // 5 second intervals
          
          // Add small random variations
          baseTemp += (Math.random() - 0.5) * 0.2;
          baseHumidity += (Math.random() - 0.5) * 0.3;
          
          // Add an anomaly in temperature around point 20
          const tempValue = i === 20 ? baseTemp + 5 : baseTemp;
          // Add an anomaly in humidity around point 10
          const humidityValue = i === 10 ? baseHumidity + 15 : baseHumidity;
          
          data.push({
            timestamp,
            temperature: parseFloat(tempValue.toFixed(1)),
            humidity: parseFloat(humidityValue.toFixed(1))
          });
        }
        
        // Detect anomalies
        const temps = data.map(d => d.temperature);
        const humidities = data.map(d => d.humidity);
        
        const tempMean = calculateMean(temps);
        const tempStdDev = calculateStdDev(temps, tempMean);
        const humidityMean = calculateMean(humidities);
        const humidityStdDev = calculateStdDev(humidities, humidityMean);
        
        // Mark anomalies
        const dataWithAnomalies = data.map(point => ({
          ...point,
          isTemperatureAnomaly: isAnomaly(point.temperature, tempMean, tempStdDev),
          isHumidityAnomaly: isAnomaly(point.humidity, humidityMean, humidityStdDev)
        }));
        
        setRealtimeData(dataWithAnomalies);
        
        // Set current values
        if (dataWithAnomalies.length > 0) {
          const latest = dataWithAnomalies[dataWithAnomalies.length - 1];
          setCurrentTemperature(latest.temperature);
          setCurrentHumidity(latest.humidity);
          setTemperatureAnomaly(!!latest.isTemperatureAnomaly);
          setHumidityAnomaly(!!latest.isHumidityAnomaly);
        }
      } catch (err) {
        console.error("Error generating data:", err);
        setError("Failed to initialize data");
      } finally {
        setLoading(false);
      }
    };
    
    generateInitialData();
    
    // Set up interval for new data
    const interval = setInterval(() => {
      try {
        const now = Date.now();
        
        // Filter out old data
        const filteredData = [...realtimeData].filter(
          point => now - point.timestamp <= timeWindow
        );
        
        // Get latest values
        const lastPoint = filteredData.length > 0 
          ? filteredData[filteredData.length - 1]
          : { temperature: 28, humidity: 60 };
          
        // Generate new values
        const newTemp = lastPoint.temperature + (Math.random() - 0.5) * 0.3;
        const newHumidity = lastPoint.humidity + (Math.random() - 0.5) * 0.4;
        
        // Random chance for anomaly
        const tempAnomaly = Math.random() < 0.05;
        const humidityAnomaly = Math.random() < 0.05;
        
        const finalTemp = tempAnomaly ? newTemp + (Math.random() > 0.5 ? 5 : -5) : newTemp;
        const finalHumidity = humidityAnomaly ? newHumidity + (Math.random() > 0.5 ? 15 : -15) : newHumidity;
        
        // Create new point
        const newPoint: DataPoint = {
          timestamp: now,
          temperature: parseFloat(finalTemp.toFixed(1)),
          humidity: parseFloat(finalHumidity.toFixed(1)),
          isTemperatureAnomaly: tempAnomaly,
          isHumidityAnomaly: humidityAnomaly
        };
        
        // Update data
        const updatedData = [...filteredData, newPoint];
        setRealtimeData(updatedData);
        
        // Update current values
        setCurrentTemperature(newPoint.temperature);
        setCurrentHumidity(newPoint.humidity);
        setTemperatureAnomaly(tempAnomaly);
        setHumidityAnomaly(humidityAnomaly);
      } catch (err) {
        console.error("Error updating data:", err);
      }
    }, 5000);
    
    return () => clearInterval(interval);
  }, [timeWindow]);

  return {
    realtimeData,
    currentTemperature,
    currentHumidity,
    temperatureAnomaly,
    humidityAnomaly,
    loading,
    error
  };
};
