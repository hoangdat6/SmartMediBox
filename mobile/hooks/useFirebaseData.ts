import { useState, useEffect } from 'react';
import { CabinetStatus, TimeOfDay, StatusData } from '@/types';
import { subscribeToData, updateData, pushData } from '@/services/firebaseService'; // Changed from mockDataService

interface FirebaseDataResult {
  cabinetStatus: CabinetStatus | null;
  temperatureData: number | null;
  humidityData: number | null;
  loading: boolean;
  error: string | null;
  openCabinet: (timeOfDay: TimeOfDay) => Promise<boolean>;
  closeCabinet: (timeOfDay: TimeOfDay) => Promise<boolean>;
}

export function useFirebaseData(): FirebaseDataResult {
  const [cabinetStatus, setCabinetStatus] = useState<CabinetStatus | null>(null);
  const [temperatureData, setTemperatureData] = useState<number | null>(null);
  const [humidityData, setHumidityData] = useState<number | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Subscribe to status updates using the mock service
    const unsubscribe = subscribeToData<StatusData>('status', (data) => {
      try {
        if (data) {
          setCabinetStatus(data.cabinet || {
            sang: 'closed',
            trua: 'closed',
            toi: 'closed'
          });
          setTemperatureData(data.temperature || 0);
          setHumidityData(data.humidity || 0);
        }
        setLoading(false);
      } catch (err: any) {
        setError(`Failed to load data: ${err.message}`);
        setLoading(false);
      }
    });

    // Cleanup function
    return () => unsubscribe();
  }, []);

  // Function to open a cabinet
  const openCabinet = async (timeOfDay: TimeOfDay): Promise<boolean> => {
    try {
      // Update cabinet status
      await updateData(`status/cabinet/${timeOfDay}`, 'opened');
      
      // Update local state immediately for responsiveness
      setCabinetStatus(prevState => {
        if (!prevState) return {
          sang: timeOfDay === 'sang' ? 'opened' : 'closed',
          trua: timeOfDay === 'trua' ? 'opened' : 'closed',
          toi: timeOfDay === 'toi' ? 'opened' : 'closed'
        };
        
        return {
          ...prevState,
          [timeOfDay]: 'opened'
        };
      });
      
      // Log the opening event
      await pushData('logs', {
        event: 'manual_open',
        cabinet: timeOfDay,
        timestamp: new Date().toISOString()
      });
      
      return true;
    } catch (err: any) {
      console.error('Error opening cabinet:', err);
      return false;
    }
  };

  // Function to close a cabinet
  const closeCabinet = async (timeOfDay: TimeOfDay): Promise<boolean> => {
    try {
      // Update cabinet status
      await updateData(`status/cabinet/${timeOfDay}`, 'closed');
      
      // Update local state immediately for responsiveness
      setCabinetStatus(prevState => {
        if (!prevState) return {
          sang: timeOfDay === 'sang' ? 'closed' : 'opened',
          trua: timeOfDay === 'trua' ? 'closed' : 'opened',
          toi: timeOfDay === 'toi' ? 'closed' : 'opened'
        };
        
        return {
          ...prevState,
          [timeOfDay]: 'closed'
        };
      });
      
      // Log the closing event
      await pushData('logs', {
        event: 'manual_close',
        cabinet: timeOfDay,
        timestamp: new Date().toISOString()
      });
      
      return true;
    } catch (err: any) {
      console.error('Error closing cabinet:', err);
      return false;
    }
  };

  return { cabinetStatus, temperatureData, humidityData, loading, error, openCabinet, closeCabinet };
}
