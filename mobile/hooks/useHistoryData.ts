import { useState, useEffect } from 'react';
import { getData } from '@/services/mockDataService';
import { format } from 'date-fns';
import { HistoryData } from '@/types';

interface HistoryDataResult {
  historyData: HistoryData | null;
  loading: boolean;
  error: string | null;
  fetchHistory: () => Promise<void>;
}

export function useHistoryData(): HistoryDataResult {
  const [historyData, setHistoryData] = useState<HistoryData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchHistory = async (): Promise<void> => {
    setLoading(true);
    try {
      const data = await getData<HistoryData>('history');
      setHistoryData(data || {});
      setLoading(false);
    } catch (err: any) {
      setError(`Failed to load history: ${err.message}`);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  return { historyData, loading, error, fetchHistory };
}
