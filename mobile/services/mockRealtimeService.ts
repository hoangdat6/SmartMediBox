import { DataPoint } from '@/hooks/useRealtimeData';

// Base temperature and humidity to start from
let baseTemperature = 27;
let baseHumidity = 55;

// Storage for our mock data
const mockSensorData: DataPoint[] = [];

// Generate initial set of data
for (let i = 0; i < 30; i++) {
  // Time is set to now minus (30-i) * 5 seconds
  const timestamp = Date.now() - ((30 - i) * 5000);
  
  // Random walk with small variations for natural looking data
  baseTemperature += (Math.random() - 0.5) * 0.2;
  baseHumidity += (Math.random() - 0.5) * 0.3;
  
  mockSensorData.push({
    timestamp,
    temperature: parseFloat(baseTemperature.toFixed(1)),
    humidity: parseFloat(baseHumidity.toFixed(1))
  });
}

// Add one anomaly for temperature
mockSensorData[20].temperature = 35.2;

// Add one anomaly for humidity
mockSensorData[15].humidity = 75.3;

// Function to subscribe to mock realtime updates
export function subscribeToRealtimeData(
  callback: (data: DataPoint[]) => void,
  timeWindow: number
): () => void {
  // Initial callback with existing data
  const filteredData = getFilteredData(timeWindow);
  callback([...filteredData]);
  
  // Set up interval to add new data every 5 seconds
  const interval = setInterval(() => {
    // Add new data point
    const now = Date.now();
    
    // Decide randomly if we'll add an anomaly (1% chance)
    const addTemperatureAnomaly = Math.random() < 0.01;
    const addHumidityAnomaly = Math.random() < 0.01;
    
    // Generate new values with small random changes
    baseTemperature += (Math.random() - 0.5) * 0.2;
    baseHumidity += (Math.random() - 0.5) * 0.3;
    
    let newTemperature = baseTemperature;
    let newHumidity = baseHumidity;
    
    // If we're adding anomalies, make significant jumps
    if (addTemperatureAnomaly) {
      newTemperature = baseTemperature + (Math.random() > 0.5 ? 5 : -5);
    }
    
    if (addHumidityAnomaly) {
      newHumidity = baseHumidity + (Math.random() > 0.5 ? 15 : -15);
    }
    
    // Create new data point
    const newDataPoint: DataPoint = {
      timestamp: now,
      temperature: parseFloat(newTemperature.toFixed(1)),
      humidity: parseFloat(newHumidity.toFixed(1))
    };
    
    // Add to storage
    mockSensorData.push(newDataPoint);
    
    // Get filtered data based on time window
    const updatedData = getFilteredData(timeWindow);
    
    // Call callback with updated data
    callback([...updatedData]);
  }, 5000);
  
  // Return unsubscribe function
  return () => clearInterval(interval);
}

// Helper function to filter data by time window
function getFilteredData(timeWindow: number): DataPoint[] {
  const now = Date.now();
  return mockSensorData.filter(point => (now - point.timestamp) <= timeWindow);
}
