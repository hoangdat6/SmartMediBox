import { subscribeToData } from "@/services/firebaseService";
import { TimeOfDay } from "@/types";
import { format, parseISO } from "date-fns";
import { useEffect, useState } from "react";

// History data interfaces
export interface HistoryValue {
	temperature: number;
	humidity: number;
	temperatureThreshold?: number;
	humidityThreshold?: number;
	cabinetOpened?: TimeOfDay;
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
}

export function useHistoryData(): HistoryDataResult {
	const [rawHistoryData, setRawHistoryData] = useState<HistoryData | null>(
		null
	);
	const [historyData, setHistoryData] = useState<ProcessedHistoryData | null>(
		null
	);
	const [loading, setLoading] = useState<boolean>(true);
	const [error, setError] = useState<string | null>(null);

	// Process raw history data into grouped format
	const processHistoryData = (data: HistoryData): ProcessedHistoryData => {
		console.log("Processing history data...");
		const processedData: ProcessedHistoryData = {};

		// Get all entries and sort them chronologically first
		const sortedEntries = Object.entries(data).sort(
			([timestampA], [timestampB]) => {
				return (
					new Date(timestampA).getTime() -
					new Date(timestampB).getTime()
				);
			}
		);

		// Limit to 50 most recent entries
		const recentEntries = sortedEntries.slice(-50);

		recentEntries.forEach(([timestamp, value]) => {
			try {
				const date = format(parseISO(timestamp), "yyyy-MM-dd");
				// Include milliseconds in the time format to ensure uniqueness
				const time = format(parseISO(timestamp), "HH:mm:ss.SSS");

				if (!processedData[date]) {
					processedData[date] = {};
				}

				processedData[date][time] = value;
			} catch (err) {
				console.error(`Error processing timestamp ${timestamp}:`, err);
			}
		});

		// Log count of processed data points for debugging
		Object.keys(processedData).forEach((date) => {
			const count = Object.keys(processedData[date]).length;
			console.log(`Processed ${count} data points for ${date}`);
		});

		return processedData;
	};

	useEffect(() => {
		// Subscribe to history updates from Firebase
		const unsubscribe = subscribeToData<HistoryData>("history", (data) => {
			try {
				if (data) {
					setRawHistoryData(data);
					setHistoryData(processHistoryData(data));
				}
				setLoading(false);
			} catch (err: any) {
				setError(`Failed to load history data: ${err.message}`);
				setLoading(false);
			}
		});

		// Cleanup subscription on unmount
		return () => unsubscribe();
	}, []);

	return {
		historyData,
		rawHistoryData,
		loading,
		error,
	};
}
