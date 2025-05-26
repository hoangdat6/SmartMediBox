import { useState, useEffect } from 'react';
import { getData } from '@/services/firebaseService'; // Changed from mockDataService
import { format, parseISO } from 'date-fns';

// Updated HistoryData interface to match the new format
export interface HistoryValue {
  temperature: number;
  humidity: number;
  cabinetOpened?: string;
}

export interface HistoryData {
  [timestamp: string]: HistoryValue;
}

// Processed history data is organized by date and time
export interface ProcessedHistoryData {
  [date: string]: {
    [time: string]: HistoryValue;
  };
}

interface HistoryDataResult {
  historyData: ProcessedHistoryData | null;
  rawHistoryData: HistoryData | null;
  loading: boolean;
  error: string | null;
  fetchHistory: () => Promise<void>;
}

export function useHistoryData(): HistoryDataResult {
  const [rawHistoryData, setRawHistoryData] = useState<HistoryData | null>(null);
  const [historyData, setHistoryData] = useState<ProcessedHistoryData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Process raw history data into grouped format
  const processHistoryData = (data: HistoryData): ProcessedHistoryData => {
    const processedData: ProcessedHistoryData = {};
    
    Object.entries(data).forEach(([timestamp, value]) => {
      try {
        const date = format(parseISO(timestamp), 'yyyy-MM-dd');
        const time = format(parseISO(timestamp), 'HH:mm');
        
        if (!processedData[date]) {
          processedData[date] = {};
        }
        
        processedData[date][time] = value;
      } catch (err) {
        console.error(`Error processing timestamp ${timestamp}:`, err);
      }
    });
    
    return processedData;
  };

  const fetchHistory = async (): Promise<void> => {
    setLoading(true);
    try {
      const data = await getData<HistoryData>('history');
      setRawHistoryData(data || {});
      setHistoryData(processHistoryData(data || {}));
      setLoading(false);
    } catch (err: any) {
      setError(`Failed to load history: ${err.message}`);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  return { historyData, rawHistoryData, loading, error, fetchHistory };
}
