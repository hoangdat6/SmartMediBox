// import { addData, getData } from "@/services/firebaseService"; // Added addData
import { format, parseISO, subDays, subHours } from "date-fns";
import { useEffect, useRef, useState } from "react";

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
	startAutoGeneration: () => void;
	stopAutoGeneration: () => void;
	isGenerating: boolean;
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
	const [isGenerating, setIsGenerating] = useState<boolean>(false);
	const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
	const lastTimestampRef = useRef<Date>(new Date());

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

		sortedEntries.forEach(([timestamp, value]) => {
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

	// Generate initial dummy history data for the past 7 days
	const generateInitialDummyData = (): HistoryData => {
		const dummyData: HistoryData = {};
		const now = new Date();

		// Generate data points for the past 7 days, every 30 minutes
		for (let i = 0; i < 7; i++) {
			const day = subDays(now, i);

			// Generate 48 data points per day (every 30 minutes)
			for (let j = 0; j < 48; j++) {
				const timestamp = subHours(day, j * 0.5).toISOString();
				const temperature =
					Math.round((Math.random() * 10 + 20) * 10) / 10; // 20-30°C
				const humidity = Math.round(Math.random() * 40 + 40); // 40-80%
				const cabinetOpened =
					Math.random() < 0.1
						? new Date(timestamp).toISOString()
						: undefined;

				dummyData[timestamp] = { temperature, humidity, cabinetOpened };
			}
		}

		return dummyData;
	};

	// Fetch history now loads dummy data instead of from Firebase
	const fetchHistory = async (): Promise<void> => {
		setLoading(true);
		try {
			// Generate dummy data instead of fetching from Firebase
			const dummyData = generateInitialDummyData();
			setRawHistoryData(dummyData);
			setHistoryData(processHistoryData(dummyData));
			setLoading(false);
		} catch (err: any) {
			setError(`Failed to generate dummy history: ${err.message}`);
			setLoading(false);
		}
	};

	// Generate random history data
	const generateHistoryEntry = (): [string, HistoryValue] => {
		// Create a completely new timestamp for each entry to ensure uniqueness
		const now = new Date();
		// Ensure we're actually using a NEW timestamp each time
		lastTimestampRef.current = now;
		const timestamp = now.toISOString();

		// Generate random values with more variation to make changes more visible
		const temperature = Math.round((Math.random() * 15 + 15) * 10) / 10; // 15-30°C with more variation
		const humidity = Math.round(Math.random() * 50 + 30); // 30-80% with more variation

		// Occasionally add cabinet opened status (10% chance)
		const cabinetOpened =
			Math.random() < 0.1 ? now.toISOString() : undefined;

		console.log(`Generated new data point at ${timestamp}`);
		return [timestamp, { temperature, humidity, cabinetOpened }];
	};

	// Add a new data point to history
	const addHistoryEntry = (): void => {
		try {
			const [timestamp, value] = generateHistoryEntry();

			// Update local state only, no Firebase
			const newRawData = {
				...rawHistoryData,
				[timestamp]: value,
			};

			// Log information about the new data point
			console.log(
				`Adding data point: ${timestamp}, T: ${value.temperature}°C, H: ${value.humidity}%`
			);

			// Set raw data
			setRawHistoryData(newRawData);

			// Process data with the new entry
			const newProcessedData = processHistoryData(newRawData);
			setHistoryData(newProcessedData);

			// Log data points for debugging
			const today = format(new Date(), "yyyy-MM-dd");
			if (newProcessedData && newProcessedData[today]) {
				const todayCount = Object.keys(newProcessedData[today]).length;
				console.log(`Total data points for today: ${todayCount}`);

				// Get the 3 most recent timestamps by properly sorting them as time values
				const timeKeys = Object.keys(newProcessedData[today]).sort(
					(a, b) => {
						// Parse the time strings into date objects for proper comparison
						const [hoursA, minutesA, secondsAndMillisA] =
							a.split(":");
						const [secondsA, millisecondsA] = secondsAndMillisA
							? secondsAndMillisA.split(".")
							: ["0", "0"];

						const [hoursB, minutesB, secondsAndMillisB] =
							b.split(":");
						const [secondsB, millisecondsB] = secondsAndMillisB
							? secondsAndMillisB.split(".")
							: ["0", "0"];

						const timeValueA =
							parseInt(hoursA) * 3600000 +
							parseInt(minutesA) * 60000 +
							parseInt(secondsA) * 1000 +
							parseInt(millisecondsA || "0");
						const timeValueB =
							parseInt(hoursB) * 3600000 +
							parseInt(minutesB) * 60000 +
							parseInt(secondsB) * 1000 +
							parseInt(millisecondsB || "0");

						return timeValueA - timeValueB;
					}
				);

				const recent = timeKeys.slice(-3);
				console.log(`3 most recent timestamps: ${recent.join(", ")}`);
			}
		} catch (err: any) {
			console.error("Error adding dummy history entry:", err);
			setError(`Failed to add dummy history entry: ${err.message}`);
		}
	};

	// Start automatic data generation
	const startAutoGeneration = (): void => {
		if (!isGenerating) {
			setIsGenerating(true);
			// Set the last timestamp to now
			lastTimestampRef.current = new Date();

			// Add data immediately
			addHistoryEntry();

			// Set up timer to add data every 1 second
			timerRef.current = setInterval(addHistoryEntry, 1000);
			console.log("Auto generation started");
		}
	};

	// Stop automatic data generation
	const stopAutoGeneration = (): void => {
		if (isGenerating && timerRef.current) {
			clearInterval(timerRef.current);
			timerRef.current = null;
			setIsGenerating(false);
		}
	};

	// Clean up timer on unmount
	useEffect(() => {
		return () => {
			if (timerRef.current) {
				clearInterval(timerRef.current);
			}
		};
	}, []);

	useEffect(() => {
		fetchHistory();
	}, []);

	return {
		historyData,
		rawHistoryData,
		loading,
		error,
		fetchHistory,
		startAutoGeneration,
		stopAutoGeneration,
		isGenerating,
	};
}
